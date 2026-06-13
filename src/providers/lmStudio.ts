import { buildSearchMessages } from "../lib/prompt";
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
        messages: buildSearchMessages(input.database ?? "pubmed", input.question),
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
