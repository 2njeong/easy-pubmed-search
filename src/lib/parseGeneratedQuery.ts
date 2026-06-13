import type { ControlledVocabTermCandidate, GeneratedQuery } from "../types";

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function isConfidence(value: unknown): value is ControlledVocabTermCandidate["confidence"] {
  return value === "high" || value === "medium" || value === "low";
}

function normalizeQuery(query: string): string {
  return query
    .replace(/\\+"/g, "\"")
    .replace(/\\+n/g, "\n")
    .replace(/\\+\r?\n/g, "\n");
}

export function parseGeneratedQuery(raw: string): GeneratedQuery {
  let value: unknown;

  try {
    value = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("LLM 응답을 JSON으로 해석할 수 없습니다.");
  }

  if (!value || typeof value !== "object") {
    throw new Error("LLM 응답 형식이 올바르지 않습니다.");
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.query !== "string" ||
    !Array.isArray(record.explanation) ||
    (!Array.isArray(record.controlledVocabTerms) && !Array.isArray(record.meshTerms)) ||
    !Array.isArray(record.cautions)
  ) {
    throw new Error("LLM 응답 형식이 올바르지 않습니다.");
  }

  const explanation = record.explanation.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    const entry = item as Record<string, unknown>;
    if (typeof entry.part !== "string" || typeof entry.reason !== "string") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return { part: entry.part, reason: entry.reason };
  });

  const controlledVocabTermsInput: unknown[] = Array.isArray(record.controlledVocabTerms)
    ? record.controlledVocabTerms
    : record.meshTerms as unknown[];

  const controlledVocabTerms = controlledVocabTermsInput.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    const entry = item as Record<string, unknown>;
    if (
      typeof entry.term !== "string" ||
      !isConfidence(entry.confidence) ||
      typeof entry.note !== "string"
    ) {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return { term: entry.term, confidence: entry.confidence, note: entry.note };
  });

  const cautions = record.cautions.map((item) => {
    if (typeof item !== "string") {
      throw new Error("LLM 응답 형식이 올바르지 않습니다.");
    }
    return item;
  });

  return {
    query: normalizeQuery(record.query),
    explanation,
    controlledVocabTerms,
    cautions,
    raw,
  };
}
