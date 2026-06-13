import { describe, expect, it } from "vitest";
import { buildSearchMessages } from "./prompt";
import type { SearchDatabaseId } from "../types";

const NON_PUBMED_DATABASES: SearchDatabaseId[] = [
  "cinahl",
  "webOfScience",
  "cochrane",
  "embase",
];

const PUBMED_ONLY_TOKENS = [
  "[MeSH Terms]",
  "[Title/Abstract]",
  "[tiab]",
  "[pt]",
];

describe("buildSearchMessages", () => {
  it("includes PubMed safety and JSON-only instructions", () => {
    const messages = buildSearchMessages("pubmed", "성인 심부전에서 SGLT2 억제제");

    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("PubMed를 실시간으로 검색한다고 주장하지 마세요");
    expect(messages[0].content).toContain("JSON만 반환하세요");
    expect(messages[0].content).toContain("PICO");
    expect(messages[0].content).toContain("empagliflozin");
    expect(messages[0].content).toContain("controlledVocabTerms");
    expect(messages[0].content).toContain("좋은 PubMed JSON 예시");
    expect(messages[0].content).toContain("AND NOT");
    expect(messages[0].content).toContain("와일드카드");
    expect(messages[0].content).toContain("query 문자열에는 AND 그룹 사이에 \\n을 포함");
    expect(messages[0].content).toContain("확실하지 않은 MeSH");
    expect(messages[0].content).toContain("[Filter]를 임상 키워드 필드로 사용하지 마세요");
    expect(messages[0].content).toContain("publication type에는 와일드카드를 붙이지 마세요");
    expect(messages[1].content).toContain("성인 심부전");
  });

  it("adds database-specific syntax guidance for CINAHL", () => {
    const messages = buildSearchMessages("cinahl", "노인 우울증과 운동 치료");

    expect(messages[0].content).toContain("CINAHL");
    expect(messages[0].content).toContain("CINAHL Headings");
    expect(messages[0].content).toContain("MH");
    expect(messages[0].content).toContain("TI");
    expect(messages[0].content).toContain("AB");
    expect(messages[0].content).toContain("좋은 CINAHL 예시");
    expect(messages[0].content).toContain("PubMed의 대괄호 필드 태그");
    expect(messages[1].content).toContain("CINAHL 검색식 초안");
  });

  it("adds database-specific syntax guidance for EMBASE", () => {
    const messages = buildSearchMessages("embase", "당뇨병과 GLP-1");

    expect(messages[0].content).toContain("EMBASE");
    expect(messages[0].content).toContain("Emtree");
    expect(messages[0].content).toContain("/exp");
    expect(messages[0].content).toContain("좋은 EMBASE 예시");
    expect(messages[1].content).toContain("EMBASE 검색식 초안");
  });

  it("tells Web of Science to avoid controlled vocabulary terms", () => {
    const messages = buildSearchMessages("webOfScience", "심부전과 입원");

    expect(messages[0].content).toContain("controlledVocabTerms는 빈 배열");
    expect(messages[0].content).toContain("AK=");
    expect(messages[0].content).toContain("좋은 Web of Science JSON 예시");
    expect(messages[0].content).not.toContain("[MeSH Terms]");
    expect(messages[0].content).not.toContain("[Title/Abstract]");
    expect(messages[0].content).not.toContain("[pt]");
  });

  it("does not leak PubMed-only field tags into non-PubMed prompts", () => {
    for (const database of NON_PUBMED_DATABASES) {
      const messages = buildSearchMessages(database, "간호사의 교대근무와 수면의 질");

      for (const token of PUBMED_ONLY_TOKENS) {
        expect(messages[0].content, `${database} prompt should not include ${token}`).not.toContain(token);
      }
    }
  });

  it("injects a bounded drug class dictionary", () => {
    const messages = buildSearchMessages("pubmed", "고혈압 약물");

    expect(messages[0].content).toContain("내장 약물 계열 사전");
    expect(messages[0].content).toContain("GLP-1 receptor agonist");
    expect(messages[0].content).toContain("목록에 없는 약물 계열");
    expect(messages[0].content).toContain("medium 이하");
  });
});
