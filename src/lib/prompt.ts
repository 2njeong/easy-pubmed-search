import type { ChatMessage } from "../types";

const SYSTEM_PROMPT = `
당신은 PubMed 검색식 작성 보조자입니다.
사용자의 자연어 연구 질문을 PubMed 검색식 초안으로 변환하세요.

규칙:
- PubMed를 실시간으로 검색한다고 주장하지 마세요.
- 논문 개수나 최신 논문 정보를 지어내지 마세요.
- MeSH 용어는 검증된 사실이 아니라 후보로 취급하세요.
- 필요할 때 [Title/Abstract], [MeSH Terms], [Publication Type], 날짜 필터 등 PubMed 호환 필드 태그를 사용하세요.
- 사용자가 입력한 중요한 임상 개념을 보존하세요.
- 식별 가능한 환자 정보가 있다면 cautions에 제거하라고 안내하세요.
- JSON만 반환하세요. 설명 문장, markdown fence, 머리말을 붙이지 마세요.

반환 JSON 형태:
{
  "query": "string",
  "explanation": [{ "part": "string", "reason": "string" }],
  "meshTerms": [{ "term": "string", "confidence": "high | medium | low", "note": "string" }],
  "cautions": ["string"]
}
`.trim();

export function buildPubMedMessages(question: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `다음 연구 질문을 PubMed 검색식 초안으로 변환하세요.\n\n${question.trim()}`,
    },
  ];
}
