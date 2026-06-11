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
