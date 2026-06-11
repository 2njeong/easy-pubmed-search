import { describe, expect, it } from "vitest";
import { classifyProviderError } from "./errors";

describe("classifyProviderError", () => {
  it("classifies network failures", () => {
    expect(classifyProviderError(new TypeError("Failed to fetch"), "ollama")).toEqual({
      title: "Ollama에 연결할 수 없습니다.",
      message: "Ollama를 실행한 뒤 다시 시도하세요.",
      debug: "Failed to fetch",
    });
  });

  it("classifies missing model errors", () => {
    expect(classifyProviderError(new Error("model not found"), "lmstudio").title).toBe("모델을 사용할 수 없습니다.");
  });
});
