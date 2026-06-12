import { Copy, Loader2, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getProvider } from "../providers";
import { clearHistory, getHistory, saveHistoryItem } from "../storage/settings";
import type {
  GeneratedQuery,
  SearchHistoryItem,
  StoredSettings,
  UserFacingError,
} from "../types";

interface GeneratorProps {
  settings: StoredSettings;
  onOpenSettings(): void;
}

export function Generator({ settings, onOpenSettings }: GeneratorProps) {
  const [activeView, setActiveView] = useState<"compose" | "history">(
    "compose"
  );
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GeneratedQuery | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const provider = getProvider(settings.provider);

  useEffect(() => {
    void getHistory().then(setHistory);
  }, []);

  async function generate() {
    setIsGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const nextResult = await provider.generatePubMedQuery(
        { question },
        settings
      );
      setResult(nextResult);
      const nextHistory = await saveHistoryItem({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        question: question.trim(),
        provider: settings.provider,
        model: settings.model,
        result: nextResult,
      });
      setHistory(nextHistory);
    } catch (caught) {
      setError(classifyProviderError(caught, settings.provider));
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyQuery() {
    if (!result?.query) {
      return;
    }
    await navigator.clipboard.writeText(result.query);
    setCopied(true);
  }

  function openHistoryItem(item: SearchHistoryItem) {
    setQuestion(item.question);
    setResult(item.result);
    setCopied(false);
    setActiveView("compose");
  }

  async function clearSearchHistory() {
    await clearHistory();
    setHistory([]);
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
          <label className="field">
            <span>연구 질문</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              placeholder="예: 성인 심부전 환자에서 SGLT2 억제제와 입원율과의 상관관계"
            />
          </label>

          <button
            className="primary-button"
            onClick={generate}
            disabled={isGenerating || question.trim().length < 4}
          >
            {isGenerating ? (
              <Loader2 className="spin" size={16} aria-hidden="true" />
            ) : null}
            {isGenerating ? "검색식 생성 중..." : "PubMed 검색식 생성"}
          </button>
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
                    <strong>{item.question}</strong>
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

      {result && activeView === "compose" ? (
        <div className="result">
          <div className="result-header">
            <h2>검색식 초안</h2>
            <button className="secondary-button" onClick={copyQuery}>
              <Copy size={14} aria-hidden="true" />
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <pre>{result.query}</pre>

          <h3>문법 설명</h3>
          <ul>
            {result.explanation.map((item) => (
              <li key={`${item.part}-${item.reason}`}>
                <strong>{item.part}</strong>: {item.reason}
              </li>
            ))}
          </ul>

          <h3>MeSH 후보</h3>
          <ul>
            {result.meshTerms.map((item) => (
              <li key={item.term}>
                <strong>{item.term}</strong> ({item.confidence}): {item.note}
              </li>
            ))}
          </ul>

          <h3>주의사항</h3>
          <ul>
            {result.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
