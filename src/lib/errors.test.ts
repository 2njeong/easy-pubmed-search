import { describe, expect, it } from "vitest";
import { classifyProviderError } from "./errors";

describe("classifyProviderError", () => {
  it("classifies network failures", () => {
    expect(classifyProviderError(new TypeError("Failed to fetch"), "ollama")).toEqual({
      title: "Ollama에 연결할 수 없습니다.",
      message: "Ollama가 실행 중인지, 모델명이 맞는지, Chrome 익스텐션 접근을 위해 OLLAMA_ORIGINS가 설정되어 있는지 확인하세요.",
      debug: "Failed to fetch",
    });
  });

  it("classifies missing model errors", () => {
    expect(classifyProviderError(new Error("model not found"), "lmstudio").title).toBe("모델을 사용할 수 없습니다.");
  });
});
