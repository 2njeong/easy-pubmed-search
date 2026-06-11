import { Copy, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getProvider } from "../providers";
import type { GeneratedQuery, StoredSettings, UserFacingError } from "../types";

interface GeneratorProps {
  settings: StoredSettings;
  onOpenSettings(): void;
}

export function Generator({ settings, onOpenSettings }: GeneratorProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GeneratedQuery | null>(null);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const provider = getProvider(settings.provider);

  async function generate() {
    setIsGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const nextResult = await provider.generatePubMedQuery({ question }, settings);
      setResult(nextResult);
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

  return (
    <section className="stack">
      <div className="status-row">
        <span>{provider.label} · {settings.model}</span>
        <button className="icon-button" onClick={onOpenSettings} aria-label="설정 열기">
          <Settings size={16} aria-hidden="true" />
        </button>
      </div>

      <label className="field">
        <span>연구 질문</span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={6}
          placeholder="예: 성인 심부전 환자에서 SGLT2 억제제가 입원율을 줄이는지 보고 싶다."
        />
      </label>

      <button className="primary-button" onClick={generate} disabled={isGenerating || question.trim().length < 4}>
        {isGenerating ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
        {isGenerating ? "검색식 생성 중..." : "PubMed 검색식 생성"}
      </button>

      {error ? (
        <div className="error-box">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
        </div>
      ) : null}

      {result ? (
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
              <li key={`${item.part}-${item.reason}`}><strong>{item.part}</strong>: {item.reason}</li>
            ))}
          </ul>

          <h3>MeSH 후보</h3>
          <ul>
            {result.meshTerms.map((item) => (
              <li key={item.term}><strong>{item.term}</strong> ({item.confidence}): {item.note}</li>
            ))}
          </ul>

          <h3>주의사항</h3>
          <ul>
            {result.cautions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
