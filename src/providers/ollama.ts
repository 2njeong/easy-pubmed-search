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
