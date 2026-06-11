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
      model: "gemma4:latest",
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
