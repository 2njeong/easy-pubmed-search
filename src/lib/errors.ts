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
      ? "Ollama가 실행 중인지, 모델명이 맞는지, Chrome 익스텐션 접근을 위해 OLLAMA_ORIGINS가 설정되어 있는지 확인하세요."
      : "LM Studio에서 Local Server를 시작하세요.",
    debug,
  };
}
