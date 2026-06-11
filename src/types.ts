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
