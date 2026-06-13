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
          controlledVocabTerms: [],
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
