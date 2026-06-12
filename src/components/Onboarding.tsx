import { CheckCircle2, PlugZap } from "lucide-react";
import { useState } from "react";
import { classifyProviderError } from "../lib/errors";
import { getProvider } from "../providers";
import type { StoredSettings, UserFacingError } from "../types";

type SetupOs = "windows" | "mac";

interface OnboardingProps {
  initialSettings: StoredSettings;
  onComplete(settings: StoredSettings): void;
}

function detectDefaultOs(): SetupOs {
  return navigator.userAgent.toLowerCase().includes("mac") ? "mac" : "windows";
}

function getExtensionOrigin(): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    return `chrome-extension://${chrome.runtime.id}`;
  }

  return "chrome-extension://<확장 프로그램 ID>";
}

export function Onboarding({ initialSettings, onComplete }: OnboardingProps) {
  const [setupOs, setSetupOs] = useState<SetupOs>(detectDefaultOs);
  const [endpoint, setEndpoint] = useState(initialSettings.endpoint);
  const [model, setModel] = useState(initialSettings.model);
  const [status, setStatus] = useState<string>("");
  const [copiedSetup, setCopiedSetup] = useState<string>("");
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const provider = getProvider("ollama");
  const extensionOrigin = getExtensionOrigin();
  const pullCommand = "ollama pull llama3.2";
  const localOnlyCommand =
    setupOs === "windows"
      ? "[Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')"
      : 'launchctl setenv OLLAMA_HOST "127.0.0.1:11434"';
  const originCommand =
    setupOs === "windows"
      ? `[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS','${extensionOrigin},http://localhost:*,http://127.0.0.1:*','User')`
      : `launchctl setenv OLLAMA_ORIGINS "${extensionOrigin},http://localhost:*,http://127.0.0.1:*"`;

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
        provider: "ollama",
        endpoint,
        model,
        onboardingComplete: true,
        lastSuccessfulConnectionAt: new Date().toISOString(),
      };
      await provider.testConnection(settings);
      setStatus(`${provider.label} 연결에 성공했습니다.`);
      onComplete(settings);
    } catch (caught) {
      setError(classifyProviderError(caught, "ollama"));
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
      <div
        className="segmented compact"
        role="tablist"
        aria-label="운영체제 선택"
      >
        <button
          className={setupOs === "windows" ? "active" : ""}
          onClick={() => setSetupOs("windows")}
        >
          Windows
        </button>
        <button
          className={setupOs === "mac" ? "active" : ""}
          onClick={() => setSetupOs("mac")}
        >
          macOS
        </button>
      </div>

      <div className="guide">
        <strong>{provider.label} 준비</strong>
        <a
          className="install-link"
          href="https://ollama.com/download"
          target="_blank"
          rel="noreferrer"
        >
          Ollama 설치 페이지 열기
        </a>
        {setupOs === "windows" ? (
          <ol>
            <li>
              위 버튼을 눌러 Ollama for Windows를 다운로드하고 설치합니다.
            </li>
            <li>
              키보드의 Windows 키를 누르고 <code>powershell</code>을 입력한 뒤,{" "}
              <code>Windows PowerShell</code>을 클릭합니다.
            </li>
            <li>
              아래 모델 다운로드 명령을 복사해서 PowerShell 창에 붙여넣고
              Enter를 누릅니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("model", pullCommand)}
                >
                  복사
                </button>
                <code>{pullCommand}</code>
                {copiedSetup === "model" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              아래 로컬 전용 실행 명령을 복사해서 PowerShell 창에 붙여넣고
              Enter를 누릅니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("host", localOnlyCommand)}
                >
                  복사
                </button>
                <code>{localOnlyCommand}</code>
                {copiedSetup === "host" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              아래 Chrome 연결 허용 명령도 같은 방식으로 실행한 뒤, Ollama를
              완전히 종료했다가 다시 실행합니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("origin", originCommand)}
                >
                  복사
                </button>
                <code>{originCommand}</code>
                {copiedSetup === "origin" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              모델명에는 <code>llama3.2:latest</code>를 입력합니다.
            </li>
          </ol>
        ) : (
          <ol>
            <li>위 버튼을 눌러 Ollama for macOS를 다운로드하고 설치합니다.</li>
            <li>Ollama 앱을 실행합니다.</li>
            <li>
              터미널 앱을 열고 아래 모델 다운로드 명령을 붙여넣은 뒤 Enter를
              누릅니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("model", pullCommand)}
                >
                  복사
                </button>
                <code>{pullCommand}</code>
                {copiedSetup === "model" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              아래 로컬 전용 실행 명령을 터미널 앱에 붙여넣은 뒤 Enter를
              누릅니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("host", localOnlyCommand)}
                >
                  복사
                </button>
                <code>{localOnlyCommand}</code>
                {copiedSetup === "host" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              아래 Chrome 연결 허용 명령도 같은 방식으로 실행한 뒤, Ollama를
              완전히 종료했다가 다시 실행합니다.
              <div className="command-block">
                <button
                  type="button"
                  onClick={() => copySetupCommand("origin", originCommand)}
                >
                  복사
                </button>
                <code>{originCommand}</code>
                {copiedSetup === "origin" && <span>복사했습니다.</span>}
              </div>
            </li>
            <li>
              모델명에는 <code>llama3.2:latest</code>를 입력합니다.
            </li>
          </ol>
        )}
      </div>

      <label className="field">
        <span>Endpoint</span>
        <input
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
        />
      </label>

      <label className="field">
        <span>모델명</span>
        <input
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder={provider.defaultModel}
        />
      </label>

      <button
        className="primary-button"
        onClick={testConnection}
        disabled={isTesting || !model.trim()}
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        {isTesting ? "연결 확인 중..." : "연결 테스트"}
      </button>

      {status ? <p className="success">{status}</p> : null}
      {error ? (
        <div className="error-box">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
          {error.debug ? <code className="error-debug">{error.debug}</code> : null}
        </div>
      ) : null}
    </section>
  );
}
