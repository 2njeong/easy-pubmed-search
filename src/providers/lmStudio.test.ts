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
            controlledVocabTerms: [],
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
