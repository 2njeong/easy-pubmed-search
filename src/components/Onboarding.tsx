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
  const isOllama = providerId === "ollama";

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
        이 익스텐션은 로컬 LLM을 포함하지 않습니다. 아래 안내대로 로컬 LLM 앱을 설치하고 서버를 켠 뒤 연결하세요.
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
        {isOllama ? (
          <ol>
            <li>Ollama 앱을 설치하고 실행합니다.</li>
            <li><code>ollama pull llama3.2</code> 또는 <code>ollama pull gemma3</code>로 모델을 받습니다.</li>
            <li>Chrome 익스텐션에서 쓰려면 macOS 터미널에서 <code>launchctl setenv OLLAMA_ORIGINS "chrome-extension://*,http://localhost:*,http://127.0.0.1:*"</code>를 한 번 실행한 뒤 Ollama를 재시작합니다.</li>
            <li>모델명에는 설치된 이름을 입력합니다. 예: <code>llama3.2:latest</code></li>
          </ol>
        ) : (
          <ol>
            <li>LM Studio 앱을 설치하고 모델을 다운로드합니다.</li>
            <li>LM Studio의 Local Server를 켭니다.</li>
            <li>Server URL이 <code>http://localhost:1234/v1</code>인지 확인합니다.</li>
            <li>모델명에는 LM Studio 서버에 올라간 모델 이름을 입력합니다.</li>
          </ol>
        )}
        <p className="guide-note">
          4B급은 저사양 기기, 7B-8B급은 일반 노트북, 12B-14B급은 성능 여유가 있는 환경에 권장합니다.
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
