import { describe, expect, it } from "vitest";
import { parseGeneratedQuery } from "./parseGeneratedQuery";

describe("parseGeneratedQuery", () => {
  it("parses a valid generated query JSON string", () => {
    const result = parseGeneratedQuery(JSON.stringify({
      query: "(heart failure[Title/Abstract]) AND (sglt2[Title/Abstract])",
      explanation: [{ part: "AND", reason: "두 개념을 모두 포함합니다." }],
      meshTerms: [{ term: "Heart Failure", confidence: "high", note: "질환 후보입니다." }],
      cautions: ["MeSH 후보는 PubMed에서 검토하세요."],
    }));

    expect(result.query).toContain("heart failure");
    expect(result.meshTerms[0].confidence).toBe("high");
  });

  it("extracts JSON from a fenced code block", () => {
    const result = parseGeneratedQuery("```json\n{\"query\":\"asthma\",\"explanation\":[],\"meshTerms\":[],\"cautions\":[]}\n```");

    expect(result.query).toBe("asthma");
  });

  it("throws a readable error when required fields are missing", () => {
    expect(() => parseGeneratedQuery("{\"query\":\"asthma\"}")).toThrow("LLM 응답 형식이 올바르지 않습니다.");
  });

  it("throws a readable error when JSON is invalid", () => {
    expect(() => parseGeneratedQuery("not json")).toThrow("LLM 응답을 JSON으로 해석할 수 없습니다.");
  });
});
