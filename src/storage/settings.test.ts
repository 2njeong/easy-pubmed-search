import { beforeEach, describe, expect, it } from "vitest";
import { clearHistory, getHistory, getSettings, saveHistoryItem, saveSettings } from "./settings";

describe("settings storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns Ollama defaults when no settings exist", async () => {
    await expect(getSettings()).resolves.toMatchObject({
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "llama3.2:latest",
      onboardingComplete: false,
    });
  });

  it("migrates LM Studio settings back to Ollama defaults", async () => {
    await saveSettings({
      provider: "lmstudio",
      endpoint: "http://localhost:1234/v1",
      model: "qwen3-8b",
      onboardingComplete: true,
      lastSuccessfulConnectionAt: "2026-06-11T00:00:00.000Z",
    });

    await expect(getSettings()).resolves.toMatchObject({
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "llama3.2:latest",
      onboardingComplete: false,
    });
  });

  it("migrates legacy Ollama default models to llama3.2:latest", async () => {
    await saveSettings({
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "gemma4:latest",
      onboardingComplete: true,
    });

    await expect(getSettings()).resolves.toMatchObject({
      provider: "ollama",
      model: "llama3.2:latest",
      onboardingComplete: true,
    });
  });

  it("saves newest history items first", async () => {
    const result = {
      query: "asthma[Title/Abstract]",
      explanation: [],
      meshTerms: [],
      cautions: [],
    };

    await saveHistoryItem({
      id: "old",
      createdAt: "2026-06-10T00:00:00.000Z",
      question: "old question",
      provider: "ollama",
      model: "llama3.2:latest",
      result,
    });
    await saveHistoryItem({
      id: "new",
      createdAt: "2026-06-11T00:00:00.000Z",
      question: "new question",
      provider: "ollama",
      model: "llama3.2:latest",
      result,
    });

    await expect(getHistory()).resolves.toMatchObject([
      { id: "new" },
      { id: "old" },
    ]);
  });

  it("clears history", async () => {
    await saveHistoryItem({
      id: "item",
      createdAt: "2026-06-11T00:00:00.000Z",
      question: "question",
      provider: "lmstudio",
      model: "qwen3-8b",
      result: {
        query: "query",
        explanation: [],
        meshTerms: [],
        cautions: [],
      },
    });

    await clearHistory();

    await expect(getHistory()).resolves.toEqual([]);
  });
});
