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
});
