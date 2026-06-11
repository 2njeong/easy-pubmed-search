import { CheckCircle2, PlugZap } from "lucide-react";
import { useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getDefaultConfig, getProvider } from "../providers";
import type { ProviderId, StoredSettings, UserFacingError } from "../types";

type SetupOs = "windows" | "mac";

interface OnboardingProps {
  initialSettings: StoredSettings;
  onComplete(settings: StoredSettings): void;
}

function detectDefaultOs(): SetupOs {
  return navigator.userAgent.toLowerCase().includes("mac") ? "mac" : "windows";
}

export function Onboarding({ initialSettings, onComplete }: OnboardingProps) {
  const [providerId, setProviderId] = useState<ProviderId>(initialSettings.provider);
  const [setupOs, setSetupOs] = useState<SetupOs>(detectDefaultOs);
  const [endpoint, setEndpoint] = useState(initialSettings.endpoint);
  const [model, setModel] = useState(initialSettings.model);
  const [status, setStatus] = useState<string>("");
  const [copiedSetup, setCopiedSetup] = useState<string>("");
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const provider = getProvider(providerId);
  const isOllama = providerId === "ollama";
  const pullCommand = "ollama pull gemma4";
  const originCommand = setupOs === "windows"
    ? "[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS','chrome-extension://*,http://localhost:*,http://127.0.0.1:*','User')"
    : "launchctl setenv OLLAMA_ORIGINS \"chrome-extension://*,http://localhost:*,http://127.0.0.1:*\"";

  function selectProvider(nextProvider: ProviderId) {
    const defaults = getDefaultConfig(nextProvider);
    setProviderId(nextProvider);
    setEndpoint(defaults.endpoint);
    setModel(defaults.model);
    setStatus("");
    setError(null);
  }

  async function copySetupCommand(label: string, command: string) {
    await navigator.clipboard.writeText(command);
    setCopiedSetup(label);
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
        이 패널은 닫히지 않도록 Chrome side panel로 열립니다. 먼저 로컬 LLM 앱을 설치하고 서버를 켠 뒤 연결하세요.
      </p>

      <div className="segmented" role="tablist" aria-label="Provider 선택">
        <button className={providerId === "ollama" ? "active" : ""} onClick={() => selectProvider("ollama")}>
          Ollama
        </button>
        <button className={providerId === "lmstudio" ? "active" : ""} onClick={() => selectProvider("lmstudio")}>
          LM Studio
        </button>
      </div>

      <div className="segmented compact" role="tablist" aria-label="운영체제 선택">
        <button className={setupOs === "windows" ? "active" : ""} onClick={() => setSetupOs("windows")}>
          Windows
        </button>
        <button className={setupOs === "mac" ? "active" : ""} onClick={() => setSetupOs("mac")}>
          macOS
        </button>
      </div>

      <div className="guide">
        <strong>{provider.label} 준비</strong>
        {isOllama ? (
          <>
            <a className="install-link" href="https://ollama.com/download" target="_blank" rel="noreferrer">
              Ollama 설치 페이지 열기
            </a>
            {setupOs === "windows" ? (
              <ol>
                <li>위 버튼을 눌러 Ollama for Windows를 다운로드하고 설치합니다.</li>
                <li>시작 메뉴에서 Ollama를 실행합니다.</li>
                <li>아래 모델 다운로드 명령을 복사해서 PowerShell에 붙여넣습니다.</li>
                <li>아래 Chrome 연결 허용 명령을 복사해서 PowerShell에 붙여넣은 뒤 Ollama를 재시작합니다.</li>
                <li>모델명에는 <code>gemma4:latest</code>를 입력합니다. 설치된 이름이 다르면 그 이름을 사용하세요.</li>
              </ol>
            ) : (
              <ol>
                <li>위 버튼을 눌러 Ollama for macOS를 다운로드하고 설치합니다.</li>
                <li>Ollama 앱을 실행합니다.</li>
                <li>아래 모델 다운로드 명령을 복사해서 터미널에 붙여넣습니다.</li>
                <li>아래 Chrome 연결 허용 명령을 복사해서 터미널에 붙여넣은 뒤 Ollama를 재시작합니다.</li>
                <li>모델명에는 <code>gemma4:latest</code>를 입력합니다. 설치된 이름이 다르면 그 이름을 사용하세요.</li>
              </ol>
            )}
            <div className="command-list">
              <button type="button" onClick={() => copySetupCommand("model", pullCommand)}>
                모델 다운로드 명령 복사
              </button>
              <code>{pullCommand}</code>
              <button type="button" onClick={() => copySetupCommand("origin", originCommand)}>
                Chrome 연결 허용 명령 복사
              </button>
              <code>{originCommand}</code>
              {copiedSetup ? <span>{copiedSetup === "model" ? "모델 다운로드" : "Chrome 연결 허용"} 명령을 복사했습니다.</span> : null}
            </div>
          </>
        ) : (
          <>
            <a className="install-link" href="https://lmstudio.ai/download" target="_blank" rel="noreferrer">
              LM Studio 설치 페이지 열기
            </a>
            <ol>
              <li>{setupOs === "windows" ? "Windows용" : "macOS용"} LM Studio를 설치하고 실행합니다.</li>
              <li>앱 안에서 Gemma 또는 Qwen 계열 instruct 모델을 검색해 다운로드합니다.</li>
              <li>왼쪽 Developer 또는 Local Server 메뉴에서 서버를 켭니다.</li>
              <li>Server URL이 <code>http://localhost:1234/v1</code>인지 확인합니다.</li>
              <li>모델명에는 LM Studio 서버에 올라간 모델 이름을 입력합니다.</li>
            </ol>
          </>
        )}
        <p className="guide-note">
          Gemma 4는 variant에 따라 무게가 다릅니다. 4B급은 일반 PC 후보, 26B/31B급은 고사양 GPU 환경에 가깝습니다.
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
