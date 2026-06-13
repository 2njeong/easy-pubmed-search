import type { SearchDatabaseId } from "../types";

const PUBMED_FIELD_TAG_PATTERN = /\[(?:mesh terms?|title\/abstract|tiab|pt)\]/i;
const PUBMED_GENERIC_FILTER_PATTERN = /\[filter\]/i;
const PUBMED_WILDCARD_PUBLICATION_TYPE_PATTERN = /\*["']?\s*\[(?:pt|publication type)\]/i;

export function validateSearchQuery(
  database: SearchDatabaseId,
  query: string
): string[] {
  const warnings: string[] = [];

  if (database !== "pubmed" && PUBMED_FIELD_TAG_PATTERN.test(query)) {
    warnings.push(`${getDatabaseLabel(database)} 검색식에 PubMed 필드 태그가 섞였을 수 있습니다.`);
  }

  if (!hasBalancedDelimiters(query)) {
    warnings.push("검색식의 괄호나 대괄호 짝이 맞지 않을 수 있습니다.");
  }

  if (database === "pubmed" && PUBMED_GENERIC_FILTER_PATTERN.test(query)) {
    warnings.push("PubMed에서 [Filter]는 임상 키워드용 필드가 아니므로 제목/초록 필드로 바꾸는 것이 안전합니다.");
  }

  if (database === "pubmed" && PUBMED_WILDCARD_PUBLICATION_TYPE_PATTERN.test(query)) {
    warnings.push("PubMed publication type 필드에는 와일드카드를 붙이지 않는 것이 안전합니다.");
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

function hasBalancedDelimiters(query: string): boolean {
  return hasBalancedPair(query, "(", ")") && hasBalancedPair(query, "[", "]");
}

function hasBalancedPair(query: string, open: string, close: string): boolean {
  let depth = 0;

  for (const character of query) {
    if (character === open) {
      depth += 1;
    }

    if (character === close) {
      depth -= 1;
    }

    if (depth < 0) {
      return false;
    }
  }

  return depth === 0;
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
