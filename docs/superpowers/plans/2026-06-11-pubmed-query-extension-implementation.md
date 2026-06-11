# PubMed Query Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome Manifest V3 popup extension that turns natural-language clinical research questions into copyable PubMed search-query drafts using Ollama or LM Studio.

**Architecture:** Use a Vite + React + TypeScript extension app with a popup-only MVP. Keep local LLM concerns behind provider modules, keep parsing/prompting in pure TypeScript for easy tests, and store only provider settings in `chrome.storage.local`.

**Tech Stack:** pnpm, Vite, React, TypeScript, Vitest, Chrome Manifest V3, `chrome.storage.local`, Ollama local API, LM Studio OpenAI-compatible API.

---

## File Structure

- Create `package.json`: pnpm scripts and dependencies.
- Create `pnpm-workspace.yaml`: workspace root marker.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`: TypeScript, Vite, and test configuration.
- Create `index.html`: Vite entry for extension popup.
- Create `public/manifest.json`: Chrome Manifest V3 popup definition, storage permission, localhost host permissions.
- Create `src/main.tsx`: React bootstrap.
- Create `src/App.tsx`: popup state machine and screen composition.
- Create `src/styles.css`: compact popup styling.
- Create `src/types.ts`: shared provider, config, and generated-query types.
- Create `src/lib/prompt.ts`: PubMed-specific system/user prompt construction.
- Create `src/lib/parseGeneratedQuery.ts`: JSON extraction and validation.
- Create `src/lib/errors.ts`: user-facing error classification.
- Create `src/providers/ollama.ts`: Ollama implementation.
- Create `src/providers/lmStudio.ts`: LM Studio implementation.
- Create `src/providers/index.ts`: provider registry and defaults.
- Create `src/storage/settings.ts`: `chrome.storage.local` wrapper with browser fallback for tests/dev.
- Create `src/components/Onboarding.tsx`: first-run provider setup.
- Create `src/components/Generator.tsx`: query generation UI.
- Create tests under `src/**/*.test.ts` and `src/**/*.test.tsx`.

## Task 1: Project Scaffold And Extension Manifest

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `public/manifest.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create package metadata and pnpm scripts**

Create `package.json`:

```json
{
  "name": "easy-pubmed-search",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/chrome": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

Do not run `pnpm install` until the user has approved dependency installation.

- [ ] **Step 2: Add workspace marker**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - .
```

- [ ] **Step 3: Add TypeScript configs**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["chrome", "vitest/globals"]
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Add Vite and Vitest config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 5: Add popup HTML and manifest**

Create `index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Easy PubMed Search</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `public/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Easy PubMed Search",
  "description": "자연어 연구 질문을 PubMed 검색식 초안으로 변환합니다.",
  "version": "0.1.0",
  "action": {
    "default_title": "Easy PubMed Search",
    "default_popup": "index.html"
  },
  "permissions": ["storage"],
  "host_permissions": [
    "http://localhost/*",
    "http://127.0.0.1/*"
  ]
}
```

- [ ] **Step 6: Add minimal React bootstrap**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Easy PubMed Search</h1>
          <p>자연어를 PubMed 검색식 초안으로 변환합니다.</p>
        </div>
      </header>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #18212f;
  background: #f7f8fa;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  width: 420px;
  min-height: 560px;
  margin: 0;
  background: #f7f8fa;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 560px;
  padding: 16px;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.app-header p {
  margin: 6px 0 0;
  color: #5f6b7a;
  font-size: 13px;
}
```

- [ ] **Step 7: Verify scaffold after dependency approval**

After the user approves dependency installation, run:

```bash
pnpm install
pnpm build
```

Expected: `pnpm build` exits with code 0 and creates `dist/manifest.json`.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts index.html public/manifest.json src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold chrome extension app"
```

## Task 2: Shared Types, Prompt Builder, And Response Parser

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/prompt.ts`
- Create: `src/lib/parseGeneratedQuery.ts`
- Create: `src/lib/errors.ts`
- Create: `src/test/setup.ts`
- Test: `src/lib/prompt.test.ts`
- Test: `src/lib/parseGeneratedQuery.test.ts`
- Test: `src/lib/errors.test.ts`

- [ ] **Step 1: Add test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write parser tests**

Create `src/lib/parseGeneratedQuery.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseGeneratedQuery } from "./parseGeneratedQuery";

describe("parseGeneratedQuery", () => {
  it("parses a valid generated query JSON string", () => {
    const result = parseGeneratedQuery(JSON.stringify({
      query: "(heart failure[Title/Abstract]) AND (sglt2[Title/Abstract])",
      explanation: [{ part: "AND", reason: "두 개념을 모두 포함합니다." }],
      meshTerms: [{ term: "Heart Failure", confidence: "high", note: "질환 후보입니다." }],
      cautions: ["MeSH 후보는 PubMed에서 검토하세요."],
    }));

    expect(result.query).toContain("heart failure");
    expect(result.meshTerms[0].confidence).toBe("high");
  });

  it("extracts JSON from a fenced code block", () => {
    const result = parseGeneratedQuery("```json\n{\"query\":\"asthma\",\"explanation\":[],\"meshTerms\":[],\"cautions\":[]}\n```");

    expect(result.query).toBe("asthma");
  });

  it("throws a readable error when required fields are missing", () => {
    expect(() => parseGeneratedQuery("{\"query\":\"asthma\"}")).toThrow("LLM 응답 형식이 올바르지 않습니다.");
  });

  it("throws a readable error when JSON is invalid", () => {
    expect(() => parseGeneratedQuery("not json")).toThrow("LLM 응답을 JSON으로 해석할 수 없습니다.");
  });
});
```

- [ ] **Step 3: Write prompt tests**

Create `src/lib/prompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPubMedMessages } from "./prompt";

describe("buildPubMedMessages", () => {
  it("includes PubMed safety and JSON-only instructions", () => {
    const messages = buildPubMedMessages("성인 심부전에서 SGLT2 억제제");

    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("PubMed를 실시간으로 검색한다고 주장하지 마세요");
    expect(messages[0].content).toContain("JSON만 반환하세요");
    expect(messages[1].content).toContain("성인 심부전");
  });
});
```

- [ ] **Step 4: Write error classification tests**

Create `src/lib/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyProviderError } from "./errors";

describe("classifyProviderError", () => {
  it("classifies network failures", () => {
    expect(classifyProviderError(new TypeError("Failed to fetch"), "ollama")).toEqual({
      title: "Ollama에 연결할 수 없습니다.",
      message: "Ollama를 실행한 뒤 다시 시도하세요.",
      debug: "Failed to fetch",
    });
  });

  it("classifies missing model errors", () => {
    expect(classifyProviderError(new Error("model not found"), "lmstudio").title).toBe("모델을 사용할 수 없습니다.");
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run:

```bash
pnpm test src/lib/parseGeneratedQuery.test.ts src/lib/prompt.test.ts src/lib/errors.test.ts
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 6: Add shared types**

Create `src/types.ts`:

```ts
export type ProviderId = "ollama" | "lmstudio";

export interface ProviderConfig {
  provider: ProviderId;
  endpoint: string;
  model: string;
}

export interface StoredSettings extends ProviderConfig {
  onboardingComplete: boolean;
  lastSuccessfulConnectionAt?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateInput {
  question: string;
}

export interface ExplanationItem {
  part: string;
  reason: string;
}

export interface MeshTermCandidate {
  term: string;
  confidence: "high" | "medium" | "low";
  note: string;
}

export interface GeneratedQuery {
  query: string;
  explanation: ExplanationItem[];
  meshTerms: MeshTermCandidate[];
  cautions: string[];
  raw?: string;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}

export interface UserFacingError {
  title: string;
  message: string;
  debug?: string;
}

export interface LlmProvider {
  id: ProviderId;
  label: string;
  defaultEndpoint: string;
  defaultModel: string;
  testConnection(config: ProviderConfig): Promise<ConnectionResult>;
  generatePubMedQuery(input: GenerateInput, config: ProviderConfig): Promise<GeneratedQuery>;
}
```

- [ ] **Step 7: Implement prompt builder**

Create `src/lib/prompt.ts`:

```ts
import type { ChatMessage } from "../types";

const SYSTEM_PROMPT = `
당신은 PubMed 검색식 작성 보조자입니다.
사용자의 자연어 연구 질문을 PubMed 검색식 초안으로 변환하세요.

규칙:
- PubMed를 실시간으로 검색한다고 주장하지 마세요.
- 논문 개수나 최신 논문 정보를 지어내지 마세요.
- MeSH 용어는 검증된 사실이 아니라 후보로 취급하세요.
- 필요할 때 [Title/Abstract], [MeSH Terms], [Publication Type], 날짜 필터 등 PubMed 호환 필드 태그를 사용하세요.
- 사용자가 입력한 중요한 임상 개념을 보존하세요.
- 식별 가능한 환자 정보가 있다면 cautions에 제거하라고 안내하세요.
- JSON만 반환하세요. 설명 문장, markdown fence, 머리말을 붙이지 마세요.

반환 JSON 형태:
{
  "query": "string",
  "explanation": [{ "part": "string", "reason": "string" }],
  "meshTerms": [{ "term": "string", "confidence": "high | medium | low", "note": "string" }],
  "cautions": ["string"]
}
`.trim();

export function buildPubMedMessages(question: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `다음 연구 질문을 PubMed 검색식 초안으로 변환하세요.\n\n${question.trim()}`,
    },
  ];
}
```

- [ ] **Step 8: Implement response parser**

Create `src/lib/parseGeneratedQuery.ts`:

```ts
import type { GeneratedQuery, MeshTermCandidate } from "../types";

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function isConfidence(value: unknown): value is MeshTermCandidate["confidence"] {
  return value === "high" || value === "medium" || value === "low";
}

export function parseGeneratedQuery(raw: string): GeneratedQuery {
  let value: unknown;

  try {
    value = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("LLM 응답을 JSON으로 해석할 수 없습니다.");
  }

  if (!value || typeof value !== "object") {
    throw new Error("LLM 응답 형식이 올바르지 않습니다.");
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.query !== "string" ||
    !Array.isArray(record.explanation) ||
    !Array.isArray(record.meshTerms) ||
    !Array.isArray(record.cautions)
  ) {
    throw new Error("LLM 응답 형식이 올바르지 않습니다.");
  }

  const explanation = record.explanation.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    const entry = item as Record<string, unknown>;
    if (typeof entry.part !== "string" || typeof entry.reason !== "string") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return { part: entry.part, reason: entry.reason };
  });

  const meshTerms = record.meshTerms.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    const entry = item as Record<string, unknown>;
    if (
      typeof entry.term !== "string" ||
      !isConfidence(entry.confidence) ||
      typeof entry.note !== "string"
    ) {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return { term: entry.term, confidence: entry.confidence, note: entry.note };
  });

  const cautions = record.cautions.map((item) => {
    if (typeof item !== "string") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return item;
  });

  return {
    query: record.query,
    explanation,
    meshTerms,
    cautions,
    raw,
  };
}
```

- [ ] **Step 9: Implement error classification**

Create `src/lib/errors.ts`:

```ts
import type { ProviderId, UserFacingError } from "../types";

function providerName(provider: ProviderId): string {
  return provider === "ollama" ? "Ollama" : "LM Studio";
}

export function classifyProviderError(error: unknown, provider: ProviderId): UserFacingError {
  const debug = error instanceof Error ? error.message : String(error);
  const lower = debug.toLowerCase();

  if (lower.includes("model") && (lower.includes("not found") || lower.includes("missing"))) {
    return {
      title: "모델을 사용할 수 없습니다.",
      message: "설정에서 모델명을 확인하고, 로컬 런타임에 해당 모델이 설치되어 있는지 확인하세요.",
      debug,
    };
  }

  if (lower.includes("json")) {
    return {
      title: "모델 응답 형식이 올바르지 않습니다.",
      message: "다시 시도하거나 더 강한 모델을 선택하세요.",
      debug,
    };
  }

  return {
    title: `${providerName(provider)}에 연결할 수 없습니다.`,
    message: provider === "ollama"
      ? "Ollama를 실행한 뒤 다시 시도하세요."
      : "LM Studio에서 Local Server를 시작하세요.",
    debug,
  };
}
```

- [ ] **Step 10: Run tests to verify they pass**

Run:

```bash
pnpm test src/lib/parseGeneratedQuery.test.ts src/lib/prompt.test.ts src/lib/errors.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit pure logic**

```bash
git add src/types.ts src/lib/prompt.ts src/lib/parseGeneratedQuery.ts src/lib/errors.ts src/test/setup.ts src/lib/*.test.ts
git commit -m "feat: add pubmed query prompt and parser"
```

## Task 3: Local LLM Providers

**Files:**
- Create: `src/providers/ollama.ts`
- Create: `src/providers/lmStudio.ts`
- Create: `src/providers/index.ts`
- Test: `src/providers/ollama.test.ts`
- Test: `src/providers/lmStudio.test.ts`

- [ ] **Step 1: Write Ollama provider tests**

Create `src/providers/ollama.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ollamaProvider } from "./ollama";

describe("ollamaProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("tests connection with configured endpoint and model", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ model: "gemma3" }))));

    const result = await ollamaProvider.testConnection({
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "gemma3",
    });

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith("http://localhost:11434/api/show", expect.objectContaining({
      method: "POST",
    }));
  });

  it("generates and parses a PubMed query", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      message: {
        content: JSON.stringify({
          query: "asthma[Title/Abstract]",
          explanation: [],
          meshTerms: [],
          cautions: [],
        }),
      },
    }))));

    const result = await ollamaProvider.generatePubMedQuery(
      { question: "asthma" },
      { provider: "ollama", endpoint: "http://localhost:11434", model: "gemma3" },
    );

    expect(result.query).toBe("asthma[Title/Abstract]");
  });
});
```

- [ ] **Step 2: Write LM Studio provider tests**

Create `src/providers/lmStudio.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { lmStudioProvider } from "./lmStudio";

describe("lmStudioProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("tests connection through OpenAI-compatible models endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      data: [{ id: "qwen3-8b" }],
    }))));

    const result = await lmStudioProvider.testConnection({
      provider: "lmstudio",
      endpoint: "http://localhost:1234/v1",
      model: "qwen3-8b",
    });

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith("http://localhost:1234/v1/models");
  });

  it("generates and parses a PubMed query", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            query: "diabetes mellitus[MeSH Terms]",
            explanation: [],
            meshTerms: [],
            cautions: [],
          }),
        },
      }],
    }))));

    const result = await lmStudioProvider.generatePubMedQuery(
      { question: "diabetes" },
      { provider: "lmstudio", endpoint: "http://localhost:1234/v1", model: "qwen3-8b" },
    );

    expect(result.query).toBe("diabetes mellitus[MeSH Terms]");
  });
});
```

- [ ] **Step 3: Run provider tests to verify they fail**

Run:

```bash
pnpm test src/providers/ollama.test.ts src/providers/lmStudio.test.ts
```

Expected: FAIL because provider modules do not exist.

- [ ] **Step 4: Implement Ollama provider**

Create `src/providers/ollama.ts`:

```ts
import { buildPubMedMessages } from "../lib/prompt";
import { parseGeneratedQuery } from "../lib/parseGeneratedQuery";
import type { ConnectionResult, GenerateInput, GeneratedQuery, LlmProvider, ProviderConfig } from "../types";

function trimEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new Error(`Ollama request failed with ${response.status}`);
  }
}

export const ollamaProvider: LlmProvider = {
  id: "ollama",
  label: "Ollama",
  defaultEndpoint: "http://localhost:11434",
  defaultModel: "gemma3",

  async testConnection(config: ProviderConfig): Promise<ConnectionResult> {
    const response = await fetch(`${trimEndpoint(config.endpoint)}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model }),
    });
    await assertOk(response);
    return { ok: true, message: "Ollama 연결에 성공했습니다." };
  },

  async generatePubMedQuery(input: GenerateInput, config: ProviderConfig): Promise<GeneratedQuery> {
    const response = await fetch(`${trimEndpoint(config.endpoint)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: buildPubMedMessages(input.question),
        stream: false,
        format: "json",
      }),
    });
    await assertOk(response);
    const data = await response.json() as { message?: { content?: string } };
    if (!data.message?.content) {
      throw new Error("Ollama response JSON is missing message.content");
    }
    return parseGeneratedQuery(data.message.content);
  },
};
```

- [ ] **Step 5: Implement LM Studio provider**

Create `src/providers/lmStudio.ts`:

```ts
import { buildPubMedMessages } from "../lib/prompt";
import { parseGeneratedQuery } from "../lib/parseGeneratedQuery";
import type { ConnectionResult, GenerateInput, GeneratedQuery, LlmProvider, ProviderConfig } from "../types";

function trimEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new Error(`LM Studio request failed with ${response.status}`);
  }
}

export const lmStudioProvider: LlmProvider = {
  id: "lmstudio",
  label: "LM Studio",
  defaultEndpoint: "http://localhost:1234/v1",
  defaultModel: "qwen3-8b",

  async testConnection(config: ProviderConfig): Promise<ConnectionResult> {
    const response = await fetch(`${trimEndpoint(config.endpoint)}/models`);
    await assertOk(response);
    const data = await response.json() as { data?: Array<{ id?: string }> };
    const hasModel = data.data?.some((model) => model.id === config.model);
    if (config.model && data.data?.length && !hasModel) {
      throw new Error(`model not found: ${config.model}`);
    }
    return { ok: true, message: "LM Studio 연결에 성공했습니다." };
  },

  async generatePubMedQuery(input: GenerateInput, config: ProviderConfig): Promise<GeneratedQuery> {
    const response = await fetch(`${trimEndpoint(config.endpoint)}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: buildPubMedMessages(input.question),
        temperature: 0.2,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });
    await assertOk(response);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LM Studio response JSON is missing choices[0].message.content");
    }
    return parseGeneratedQuery(content);
  },
};
```

- [ ] **Step 6: Add provider registry**

Create `src/providers/index.ts`:

```ts
import type { LlmProvider, ProviderConfig, ProviderId } from "../types";
import { lmStudioProvider } from "./lmStudio";
import { ollamaProvider } from "./ollama";

export const providers: Record<ProviderId, LlmProvider> = {
  ollama: ollamaProvider,
  lmstudio: lmStudioProvider,
};

export function getProvider(id: ProviderId): LlmProvider {
  return providers[id];
}

export function getDefaultConfig(provider: ProviderId = "ollama"): ProviderConfig {
  const selected = getProvider(provider);
  return {
    provider,
    endpoint: selected.defaultEndpoint,
    model: selected.defaultModel,
  };
}
```

- [ ] **Step 7: Run provider tests to verify they pass**

Run:

```bash
pnpm test src/providers/ollama.test.ts src/providers/lmStudio.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit providers**

```bash
git add src/providers src/types.ts src/lib
git commit -m "feat: add local llm providers"
```

## Task 4: Settings Storage

**Files:**
- Create: `src/storage/settings.ts`
- Test: `src/storage/settings.test.ts`

- [ ] **Step 1: Write storage tests**

Create `src/storage/settings.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { getSettings, saveSettings } from "./settings";

describe("settings storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns Ollama defaults when no settings exist", async () => {
    await expect(getSettings()).resolves.toMatchObject({
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "gemma3",
      onboardingComplete: false,
    });
  });

  it("saves and loads settings", async () => {
    await saveSettings({
      provider: "lmstudio",
      endpoint: "http://localhost:1234/v1",
      model: "qwen3-8b",
      onboardingComplete: true,
      lastSuccessfulConnectionAt: "2026-06-11T00:00:00.000Z",
    });

    await expect(getSettings()).resolves.toMatchObject({
      provider: "lmstudio",
      onboardingComplete: true,
    });
  });
});
```

- [ ] **Step 2: Run storage tests to verify they fail**

Run:

```bash
pnpm test src/storage/settings.test.ts
```

Expected: FAIL because `settings.ts` does not exist.

- [ ] **Step 3: Implement storage wrapper**

Create `src/storage/settings.ts`:

```ts
import type { StoredSettings } from "../types";
import { getDefaultConfig } from "../providers";

const STORAGE_KEY = "easyPubMedSearch.settings";

const defaultSettings: StoredSettings = {
  ...getDefaultConfig("ollama"),
  onboardingComplete: false,
};

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function getSettings(): Promise<StoredSettings> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...defaultSettings, ...(result[STORAGE_KEY] as Partial<StoredSettings> | undefined) };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? { ...defaultSettings, ...JSON.parse(raw) as Partial<StoredSettings> } : defaultSettings;
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
```

- [ ] **Step 4: Run storage tests to verify they pass**

Run:

```bash
pnpm test src/storage/settings.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit storage**

```bash
git add src/storage/settings.ts src/storage/settings.test.ts
git commit -m "feat: persist provider settings"
```

## Task 5: Onboarding And Generator UI

**Files:**
- Create: `src/components/Onboarding.tsx`
- Create: `src/components/Generator.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write app flow tests**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders onboarding copy before setup is complete", async () => {
    render(<App />);

    expect(await screen.findByText("로컬 LLM 연결 설정")).toBeInTheDocument();
    expect(screen.getByText("Ollama")).toBeInTheDocument();
    expect(screen.getByText("LM Studio")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test to verify it fails**

Run:

```bash
pnpm test src/App.test.tsx
```

Expected: FAIL because onboarding UI is not implemented.

- [ ] **Step 3: Implement onboarding component**

Create `src/components/Onboarding.tsx`:

```tsx
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
```

- [ ] **Step 4: Implement generator component**

Create `src/components/Generator.tsx`:

```tsx
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
```

- [ ] **Step 5: Wire app state**

Replace `src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Generator } from "./components/Generator";
import { Onboarding } from "./components/Onboarding";
import { getSettings, saveSettings } from "./storage/settings";
import type { StoredSettings } from "./types";

export function App() {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  async function completeOnboarding(nextSettings: StoredSettings) {
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setShowSettings(false);
  }

  if (!settings) {
    return <main className="app-shell"><p className="muted">설정을 불러오는 중...</p></main>;
  }

  const needsOnboarding = showSettings || !settings.onboardingComplete;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Easy PubMed Search</h1>
          <p>자연어를 PubMed 검색식 초안으로 변환합니다.</p>
        </div>
      </header>

      {needsOnboarding ? (
        <Onboarding initialSettings={settings} onComplete={completeOnboarding} />
      ) : (
        <Generator settings={settings} onOpenSettings={() => setShowSettings(true)} />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Replace styles**

Replace `src/styles.css` with:

```css
:root {
  color: #18212f;
  background: #f7f8fa;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  width: 420px;
  min-height: 560px;
  margin: 0;
  background: #f7f8fa;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.app-shell {
  min-height: 560px;
  padding: 16px;
}

.app-header {
  margin-bottom: 14px;
}

.app-header h1,
.section-title h2,
.result h2,
.result h3 {
  margin: 0;
}

.app-header h1 {
  font-size: 20px;
  line-height: 1.2;
}

.app-header p,
.muted {
  color: #5f6b7a;
  font-size: 13px;
  line-height: 1.45;
}

.panel,
.stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title,
.status-row,
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-title {
  justify-content: flex-start;
}

.section-title h2,
.result h2 {
  font-size: 16px;
}

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.segmented button,
.icon-button {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #415064;
}

.segmented button {
  min-height: 34px;
}

.segmented button.active {
  background: #1f6feb;
  color: #ffffff;
}

.guide,
.result,
.error-box {
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.guide p,
.error-box p {
  margin: 6px 0 0;
  color: #5f6b7a;
  font-size: 13px;
  line-height: 1.45;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 650;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #cdd5df;
  border-radius: 8px;
  background: #ffffff;
  color: #18212f;
  padding: 10px;
  font-weight: 400;
}

.field textarea {
  resize: vertical;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 700;
}

.primary-button {
  width: 100%;
  background: #1f6feb;
  color: #ffffff;
}

.secondary-button {
  min-width: 78px;
  background: #eef4ff;
  color: #1f4d8f;
  border-color: #c8d8f3;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #d8dee8;
  background: #ffffff;
}

.status-row {
  color: #415064;
  font-size: 13px;
}

.success {
  margin: 0;
  color: #16703c;
  font-size: 13px;
  font-weight: 650;
}

.error-box {
  border-color: #f1c2c2;
  background: #fff6f6;
}

.error-box strong {
  color: #a22929;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result pre {
  overflow-x: auto;
  white-space: pre-wrap;
  margin: 0;
  border-radius: 8px;
  background: #101820;
  color: #f8fafc;
  padding: 12px;
  font-size: 12px;
  line-height: 1.45;
}

.result h3 {
  font-size: 13px;
}

.result ul {
  margin: 0;
  padding-left: 18px;
  color: #415064;
  font-size: 12px;
  line-height: 1.45;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 7: Run UI test**

Run:

```bash
pnpm test src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit UI**

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles.css
git commit -m "feat: add popup onboarding and generator ui"
```

## Task 6: Build, Manual Verification, And Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README**

Replace `README.md`:

```md
# Easy PubMed Search

자연어 연구 질문을 PubMed 검색식 초안으로 변환하는 크롬 익스텐션입니다.

## MVP 범위

- 크롬 툴바 팝업
- Ollama 및 LM Studio 로컬 LLM 지원
- PubMed 검색식 생성
- 문법 설명
- MeSH 후보 제안
- 검색식 복사

MVP는 PubMed 페이지에 UI를 삽입하지 않고, 검색을 자동 실행하지 않습니다.

## 로컬 LLM 준비

이 익스텐션은 LLM을 포함하지 않습니다. 사용자는 Ollama 또는 LM Studio를 별도로 설치하고 모델을 실행해야 합니다.

### Ollama

- 기본 endpoint: `http://localhost:11434`
- 추천 모델 예시: `gemma3`, `qwen3`, `llama3.1`

### LM Studio

- 기본 endpoint: `http://localhost:1234/v1`
- LM Studio에서 Local Server를 켠 뒤 모델명을 입력합니다.

## 개발

```bash
pnpm install
pnpm dev
```

## 빌드

```bash
pnpm build
```

빌드 결과물은 `dist/`에 생성됩니다. Chrome의 `chrome://extensions`에서 Developer mode를 켠 뒤 `dist/`를 unpacked extension으로 로드합니다.

## 테스트

```bash
pnpm test
```
```

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
pnpm build
```

Expected: build exits with code 0 and `dist/manifest.json` exists.

- [ ] **Step 4: Manually verify extension popup**

Load `dist/` in Chrome as an unpacked extension. Verify:

- Popup opens at a stable 420px width.
- First launch shows "로컬 LLM 연결 설정".
- Ollama and LM Studio provider buttons switch endpoint and default model.
- Connection failure shows actionable Korean error text when no local server is running.
- With a running provider and model, connection test succeeds.
- Generator screen accepts a clinical research question.
- Generated query appears as primary output.
- Copy button copies only the query text.
- No PubMed tab opens automatically.
- No PubMed DOM modification occurs.

- [ ] **Step 5: Commit docs and verification fixes**

```bash
git add README.md
git commit -m "docs: add local llm extension setup guide"
```

## Self-Review Notes

- Spec coverage: popup MVP, Ollama and LM Studio, onboarding, model guidance, endpoint/model settings, connection test, JSON output contract, copy-only behavior, storage, privacy warnings, and testing are all mapped to tasks.
- Scope control: cloud providers, PubMed DOM injection, PubMed auto-search, NLM MeSH lookup, accounts, sync, and history remain out of scope.
- Type consistency: provider ids are `ollama` and `lmstudio` across types, providers, storage, and UI.
- Dependency note: because the project has no existing lockfile, `pnpm install` requires explicit user approval before execution.
