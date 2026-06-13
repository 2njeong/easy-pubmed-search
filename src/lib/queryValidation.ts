import type { SearchDatabaseId } from "../types";

const PUBMED_FIELD_TAG_PATTERN = /\[(?:mesh terms?|title\/abstract|tiab|pt)\]/i;

export function validateSearchQuery(
  database: SearchDatabaseId,
  query: string
): string[] {
  const warnings: string[] = [];

  if (database !== "pubmed" && PUBMED_FIELD_TAG_PATTERN.test(query)) {
    warnings.push(`${getDatabaseLabel(database)} 검색식에 PubMed 필드 태그가 섞였을 수 있습니다.`);
  }

  if (database === "webOfScience" && !/\b(?:TS|TI|AK)=/i.test(query)) {
    warnings.push("Web of Science 검색식은 보통 TS= topic field를 포함하는 것이 안전합니다.");
  }

  if (database === "cinahl" && !/\b(?:MH|TI|AB)\b/i.test(query)) {
    warnings.push("CINAHL 검색식은 보통 MH, TI, AB 필드를 명시하는 것이 안전합니다.");
  }

  if (database === "cochrane" && !/(?:\[mh\s|:ti,ab,kw|\bNEAR\/\d+\b)/i.test(query)) {
    warnings.push("Cochrane 검색식은 보통 [mh ...], :ti,ab,kw, NEAR/n 문법을 활용합니다.");
  }

  if (database === "embase" && !/(?:'[^']+'\/exp|:ti,ab|\bti,ab\b)/i.test(query)) {
    warnings.push("EMBASE 검색식은 보통 Emtree '/exp' 또는 제목/초록 필드를 포함합니다.");
  }

  return warnings;
}

function getDatabaseLabel(database: SearchDatabaseId): string {
  switch (database) {
    case "cinahl":
      return "CINAHL";
    case "webOfScience":
      return "Web of Science";
    case "cochrane":
      return "Cochrane";
    case "embase":
      return "EMBASE";
    case "pubmed":
      return "PubMed";
  }
}
