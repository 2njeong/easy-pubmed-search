import { describe, expect, it } from "vitest";
import { validateSearchQuery } from "./queryValidation";

describe("validateSearchQuery", () => {
  it("warns when a CINAHL query contains PubMed field tags", () => {
    const warnings = validateSearchQuery(
      "cinahl",
      '"Depression"[MeSH Terms] AND exercise[Title/Abstract]'
    );

    expect(warnings).toContain("CINAHL 검색식에 PubMed 필드 태그가 섞였을 수 있습니다.");
  });

  it("warns when a Web of Science query does not use a topic field", () => {
    const warnings = validateSearchQuery(
      "webOfScience",
      'depression AND "older adults"'
    );

    expect(warnings).toContain("Web of Science 검색식은 보통 TS= topic field를 포함하는 것이 안전합니다.");
  });

  it("does not warn for a matching EMBASE query", () => {
    const warnings = validateSearchQuery(
      "embase",
      "'depression'/exp AND exercise:ti,ab"
    );

    expect(warnings).toEqual([]);
  });

  it("warns when a PubMed query uses generic filter tags for clinical keywords", () => {
    const warnings = validateSearchQuery(
      "pubmed",
      'asthma[Title/Abstract] AND NOT (infection*[Filter] OR sepsis*[Filter])'
    );

    expect(warnings).toContain("PubMed에서 [Filter]는 임상 키워드용 필드가 아니므로 제목/초록 필드로 바꾸는 것이 안전합니다.");
  });

  it("warns when a PubMed query applies a wildcard to a publication type", () => {
    const warnings = validateSearchQuery(
      "pubmed",
      '"Randomized Controlled Trial*"[pt] AND asthma[Title/Abstract]'
    );

    expect(warnings).toContain("PubMed publication type 필드에는 와일드카드를 붙이지 않는 것이 안전합니다.");
  });

  it("warns when a query has unmatched brackets or parentheses", () => {
    const warnings = validateSearchQuery(
      "pubmed",
      'asthma[Title/Abstract] AND bronchiolitis*[Filter'
    );

    expect(warnings).toContain("검색식의 괄호나 대괄호 짝이 맞지 않을 수 있습니다.");
  });
});
