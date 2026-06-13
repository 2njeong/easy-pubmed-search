import { Copy, Loader2, RotateCcw, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getSearchDatabase, SEARCH_DATABASES } from "../lib/prompt";
import { validateSearchQuery } from "../lib/queryValidation";
import { getProvider } from "../providers";
import { clearHistory, getHistory, saveHistoryItem } from "../storage/settings";
import type {
  GeneratedQuery,
  SearchDatabaseId,
  SearchHistoryItem,
  StoredSettings,
  UserFacingError,
} from "../types";

interface GeneratorProps {
  settings: StoredSettings;
  onOpenSettings(): void;
}

type DatabaseResultState = Partial<Record<SearchDatabaseId, GeneratedQuery>>;

const NEW_QUESTION_CONFIRM_MESSAGE =
  "현재 입력한 질문과 화면에 생성된 검색식이 초기화됩니다.\n생성된 검색식은 기록 탭에서 다시 확인할 수 있습니다.";

export function Generator({ settings, onOpenSettings }: GeneratorProps) {
  const [activeView, setActiveView] = useState<"compose" | "history">(
    "compose"
  );
  const [question, setQuestion] = useState("");
  const [activeDatabase, setActiveDatabase] = useState<SearchDatabaseId>("pubmed");
  const [resultsByDatabase, setResultsByDatabase] = useState<DatabaseResultState>({});
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [generatingDatabase, setGeneratingDatabase] = useState<SearchDatabaseId | null>(null);
  const [copied, setCopied] = useState(false);

  const provider = getProvider(settings.provider);
  const activeDatabaseConfig = getSearchDatabase(activeDatabase);
  const activeResult = resultsByDatabase[activeDatabase] ?? null;
  const activeControlledTerms =
    activeResult?.controlledVocabTerms ?? activeResult?.meshTerms ?? [];
  const isGenerating = generatingDatabase !== null;
  const hasDraft = question.trim().length > 0 || Object.keys(resultsByDatabase).length > 0;

  useEffect(() => {
    void getHistory().then(setHistory);
  }, []);

  async function generate(database: SearchDatabaseId, options: { force?: boolean } = {}) {
    if (!options.force && resultsByDatabase[database]) {
      setActiveDatabase(database);
      setCopied(false);
      return;
    }

    setActiveDatabase(database);
    setGeneratingDatabase(database);
    setError(null);
    setCopied(false);
    try {
      const nextResult = await provider.generatePubMedQuery(
        { question, database },
        settings
      );
      const validationWarnings = validateSearchQuery(database, nextResult.query);
      const checkedResult = {
        ...nextResult,
        cautions: [...nextResult.cautions, ...validationWarnings],
      };
      setResultsByDatabase((current) => ({
        ...current,
        [database]: checkedResult,
      }));
      const nextHistory = await saveHistoryItem({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        question: question.trim(),
        database,
        provider: settings.provider,
        model: settings.model,
        result: checkedResult,
      });
      setHistory(nextHistory);
    } catch (caught) {
      setError(classifyProviderError(caught, settings.provider));
    } finally {
      setGeneratingDatabase(null);
    }
  }

  async function copyQuery() {
    if (!activeResult?.query) {
      return;
    }
    await navigator.clipboard.writeText(activeResult.query);
    setCopied(true);
  }

  function openHistoryItem(item: SearchHistoryItem) {
    const database = item.database ?? "pubmed";
    setQuestion(item.question);
    setActiveDatabase(database);
    setResultsByDatabase((current) => ({
      ...current,
      [database]: item.result,
    }));
    setCopied(false);
    setActiveView("compose");
  }

  async function clearSearchHistory() {
    await clearHistory();
    setHistory([]);
  }

  function startNewQuestion() {
    if (!window.confirm(NEW_QUESTION_CONFIRM_MESSAGE)) {
      return;
    }

    setQuestion("");
    setResultsByDatabase({});
    setActiveDatabase("pubmed");
    setError(null);
    setCopied(false);
  }

  return (
    <section className="stack">
      <div className="status-row">
        <span>
          {provider.label} · {settings.model}
        </span>
        <button
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="설정 열기"
        >
          <Settings size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="segmented compact" role="tablist" aria-label="화면 선택">
        <button
          className={activeView === "compose" ? "active" : ""}
          onClick={() => setActiveView("compose")}
        >
          생성
        </button>
        <button
          className={activeView === "history" ? "active" : ""}
          onClick={() => setActiveView("history")}
        >
          기록
        </button>
      </div>

      {activeView === "compose" ? (
        <>
          <div className="field">
            <div className="field-heading">
              <label htmlFor="research-question">연구 질문</label>
              {hasDraft ? (
                <button
                  type="button"
                  className="small-text-button"
                  onClick={startNewQuestion}
                >
                  새 질문
                </button>
              ) : null}
            </div>
            <textarea
              id="research-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              placeholder="예: 성인 심부전 환자에서 SGLT2 억제제와 입원율과의 상관관계"
            />
          </div>

          <p className="database-tabs-guidance">
            DB 탭을 누르면 해당 데이터베이스 문법에 맞춘 검색식이 생성됩니다.
          </p>

          <div
            className="database-tabs"
            role="tablist"
            aria-label="검색 데이터베이스 선택"
          >
            {SEARCH_DATABASES.map((database) => {
              const databaseResult = resultsByDatabase[database.id];
              const isActive = activeDatabase === database.id;
              const isCurrentGenerating = generatingDatabase === database.id;

              return (
                <button
                  key={database.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? "active" : ""}
                  onClick={() => void generate(database.id)}
                  disabled={isGenerating || question.trim().length < 4}
                >
                  {isCurrentGenerating ? (
                    <Loader2 className="spin" size={14} aria-hidden="true" />
                  ) : null}
                  {database.label}
                  {databaseResult ? <span aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="history-panel">
          <div className="result-header">
            <h2>검색 기록</h2>
            <button
              className="icon-button"
              onClick={clearSearchHistory}
              aria-label="검색 기록 삭제"
              disabled={!history.length}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
          {history.length ? (
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => openHistoryItem(item)}>
                    <div className="history-item-header">
                      <strong>{item.question}</strong>
                      <span className="database-chip">
                        {getSearchDatabase(item.database ?? "pubmed").label}
                      </span>
                    </div>
                    <span>
                      {new Date(item.createdAt).toLocaleString()} · {item.model}
                    </span>
                    <code>{item.result.query}</code>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">아직 저장된 검색 기록이 없습니다.</p>
          )}
        </div>
      )}

      {error ? (
        <div className="error-box">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
        </div>
      ) : null}

      {activeResult && activeView === "compose" ? (
        <div className="result">
          <div className="result-header">
            <h2>{activeDatabaseConfig.label} 검색식 초안</h2>
            <div className="result-actions">
              <button
                className="compact-action-button"
                onClick={() => void generate(activeDatabase, { force: true })}
                disabled={isGenerating || question.trim().length < 4}
              >
                {generatingDatabase === activeDatabase ? (
                  <Loader2 className="spin" size={14} aria-hidden="true" />
                ) : (
                  <RotateCcw size={13} aria-hidden="true" />
                )}
                다시
              </button>
              <button className="compact-action-button" onClick={copyQuery}>
                <Copy size={13} aria-hidden="true" />
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
          <pre>{activeResult.query}</pre>

          <h3>문법 설명</h3>
          <ul>
            {activeResult.explanation.map((item) => (
              <li key={`${item.part}-${item.reason}`}>
                <strong>{item.part}</strong>: {item.reason}
              </li>
            ))}
          </ul>

          <h3>{activeDatabaseConfig.controlledVocabulary} 후보</h3>
          <ul>
            {activeControlledTerms.map((item) => (
              <li key={item.term}>
                <strong>{item.term}</strong> ({item.confidence}): {item.note}
              </li>
            ))}
          </ul>

          <h3>주의사항</h3>
          <ul>
            {activeResult.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
