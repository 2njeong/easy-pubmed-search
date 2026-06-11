import { CheckCircle2, PlugZap } from "lucide-react";
import { useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getDefaultConfig, getProvider } from "../providers";
import type { ProviderId, StoredSettings, UserFacingError } from "../types";

interface OnboardingProps {
  initialSettings: StoredSettings;
  onComplete(settings: StoredSettings): void;
}

export function Onboarding({ initialSettings, onComplete }: OnboardingProps) {
  const [providerId, setProviderId] = useState<ProviderId>(initialSettings.provider);
  const [endpoint, setEndpoint] = useState(initialSettings.endpoint);
  const [model, setModel] = useState(initialSettings.model);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const provider = getProvider(providerId);

  function selectProvider(nextProvider: ProviderId) {
    const defaults = getDefaultConfig(nextProvider);
    setProviderId(nextProvider);
    setEndpoint(defaults.endpoint);
    setModel(defaults.model);
    setStatus("");
    setError(null);
  }

  async function testConnection() {
    setIsTesting(true);
    setStatus("");
    setError(null);
    try {
      const settings: StoredSettings = {
        provider: providerId,
        endpoint,
        model,
        onboardingComplete: true,
        lastSuccessfulConnectionAt: new Date().toISOString(),
      };
      await provider.testConnection(settings);
      setStatus(`${provider.label} 연결에 성공했습니다.`);
      onComplete(settings);
    } catch (caught) {
      setError(classifyProviderError(caught, providerId));
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-title">
        <PlugZap size={18} aria-hidden="true" />
        <h2>로컬 LLM 연결 설정</h2>
      </div>

      <p className="muted">
        이 익스텐션은 로컬 LLM을 포함하지 않습니다. Ollama 또는 LM Studio를 설치하고 모델을 실행한 뒤 연결하세요.
      </p>

      <div className="segmented" role="tablist" aria-label="Provider 선택">
        <button className={providerId === "ollama" ? "active" : ""} onClick={() => selectProvider("ollama")}>
          Ollama
        </button>
        <button className={providerId === "lmstudio" ? "active" : ""} onClick={() => selectProvider("lmstudio")}>
          LM Studio
        </button>
      </div>

      <div className="guide">
        <strong>{provider.label} 준비</strong>
        <p>
          4B급은 저사양 기기, 7B-8B급은 일반 노트북, 12B-14B급은 성능 여유가 있는 환경에 권장합니다.
          Gemma, Qwen, Llama, Mistral 계열 instruct 모델을 추천합니다.
        </p>
      </div>

      <label className="field">
        <span>Endpoint</span>
        <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
      </label>

      <label className="field">
        <span>모델명</span>
        <input value={model} onChange={(event) => setModel(event.target.value)} placeholder={provider.defaultModel} />
      </label>

      <button className="primary-button" onClick={testConnection} disabled={isTesting || !model.trim()}>
        <CheckCircle2 size={16} aria-hidden="true" />
        {isTesting ? "연결 확인 중..." : "연결 테스트"}
      </button>

      {status ? <p className="success">{status}</p> : null}
      {error ? (
        <div className="error-box">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
        </div>
      ) : null}
    </section>
  );
}
