import type { ChatMessage, SearchDatabase, SearchDatabaseId } from "../types";

export const SEARCH_DATABASES: SearchDatabase[] = [
  {
    id: "pubmed",
    label: "PubMed",
    controlledVocabulary: "MeSH",
  },
  {
    id: "cinahl",
    label: "CINAHL",
    controlledVocabulary: "CINAHL Headings",
  },
  {
    id: "webOfScience",
    label: "Web of Science",
    controlledVocabulary: "주요 용어",
  },
  {
    id: "cochrane",
    label: "Cochrane",
    controlledVocabulary: "MeSH",
  },
  {
    id: "embase",
    label: "EMBASE",
    controlledVocabulary: "Emtree",
  },
];

export function getSearchDatabase(id: SearchDatabaseId): SearchDatabase {
  return SEARCH_DATABASES.find((database) => database.id === id) ?? SEARCH_DATABASES[0];
}

const DATABASE_GUIDANCE: Record<SearchDatabaseId, string> = {
  pubmed: `
대상 데이터베이스: PubMed
- MeSH 공식 용어는 "Term"[MeSH Terms] 형식으로 작성하세요.
- 제목/초록 검색은 term[Title/Abstract] 또는 term[tiab] 형식으로 작성하세요.
- publication type은 "Randomized Controlled Trial"[pt] 같은 PubMed 필드를 사용하세요.

좋은 PubMed 예시:
("Heart Failure"[MeSH Terms] OR "heart failure"[Title/Abstract])
AND
("Sodium-Glucose Transporter 2 Inhibitors"[MeSH Terms] OR "SGLT2 inhibitor*"[Title/Abstract] OR empagliflozin[Title/Abstract] OR dapagliflozin[Title/Abstract])
AND
(hospitalization*[Title/Abstract] OR admission*[Title/Abstract])
`.trim(),
  cinahl: `
대상 데이터베이스: CINAHL
- CINAHL Headings 후보를 우선 고려하세요.
- 주제어는 MH "Term" 형식을 사용하세요. 폭넓은 하위 용어가 필요하면 MH "Term+" 형식을 제안할 수 있습니다.
- 제목/초록 검색은 TI term 또는 AB term 형식을 사용하세요.
- PubMed의 [MeSH Terms], [Title/Abstract], [pt] 필드는 사용하지 마세요.

좋은 CINAHL 예시:
(MH "Heart Failure+" OR TI "heart failure" OR AB "heart failure")
AND
(MH "Sodium-Glucose Transporter 2 Inhibitors" OR TI "SGLT2 inhibitor*" OR AB "SGLT2 inhibitor*" OR TI empagliflozin OR AB empagliflozin)
AND
(TI hospitalization* OR AB hospitalization* OR TI admission* OR AB admission*)
`.trim(),
  webOfScience: `
대상 데이터베이스: Web of Science
- 통제어가 없으므로 Topic Search 중심으로 작성하세요.
- 주제 검색은 TS=(term OR "phrase") 형식을 사용하세요.
- 제목만 필요한 경우 TI=, 저자 키워드는 AK=를 사용할 수 있지만 기본은 TS=로 작성하세요.
- PubMed의 MeSH 필드나 EMBASE Emtree 문법은 사용하지 마세요.

좋은 Web of Science 예시:
TS=("heart failure" OR "cardiac failure")
AND
TS=("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin)
AND
TS=(hospitalization* OR admission*)
`.trim(),
  cochrane: `
대상 데이터베이스: Cochrane Library
- Cochrane 검색 인터페이스에서 쓸 수 있는 검색식으로 작성하세요.
- MeSH descriptor는 [mh "Term"] 형식을 사용하세요.
- 제목/초록/키워드는 :ti,ab,kw 형식을 사용하세요.
- 인접어가 필요하면 NEAR/n을 사용할 수 있습니다.

좋은 Cochrane 예시:
([mh "Heart Failure"] OR ("heart failure" OR "cardiac failure"):ti,ab,kw)
AND
([mh "Sodium-Glucose Transporter 2 Inhibitors"] OR ("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin):ti,ab,kw)
AND
(hospitalization* OR admission*):ti,ab,kw
`.trim(),
  embase: `
대상 데이터베이스: EMBASE
- Emtree 용어 후보를 우선 고려하세요.
- Emtree 폭넓은 검색은 'term'/exp 형식을 사용하세요.
- 제목/초록 검색은 term:ti,ab 형식을 사용하세요.
- PubMed의 [MeSH Terms], [Title/Abstract], [pt] 필드는 사용하지 마세요.

좋은 EMBASE 예시:
('heart failure'/exp OR 'heart failure':ti,ab OR 'cardiac failure':ti,ab)
AND
('sodium glucose cotransporter 2 inhibitor'/exp OR 'SGLT2 inhibitor*':ti,ab OR empagliflozin:ti,ab OR dapagliflozin:ti,ab)
AND
(hospitalization*:ti,ab OR admission*:ti,ab)
`.trim(),
};

const SYSTEM_PROMPT = `
당신은 의학 문헌 데이터베이스 검색식 작성 전문가입니다.
사용자의 한국어 질문을 지정된 데이터베이스에서 바로 쓸 수 있는 영어 검색식으로 변환하세요.

검색식 작성 방법:

1. PICO 분해
   - P (Population): 대상 환자군
   - I (Intervention/Exposure): 중재 또는 노출
   - C (Comparison): 비교군 (언급 시만)
   - O (Outcome): 결과 지표

2. 각 요소별 동의어 그룹
   각 PICO 요소를 OR 그룹으로 구성하세요:
   - 지정된 데이터베이스의 통제어 또는 주제어
   - 지정된 데이터베이스의 제목/초록/주제 필드
   - 어미 변형은 * 사용: 반드시 데이터베이스 문법에 맞는 위치에 붙이세요
   - P에 질환/상태와 인구 한정자가 함께 있으면 둘 다 별도 AND 그룹으로 작성하세요
     예) "심부전 성인 환자" → (heart failure 그룹) AND (adult 그룹)

3. 약물 계열은 반드시 개별 성분명 포함
   - SGLT2 inhibitor* → empagliflozin, dapagliflozin, canagliflozin, ertugliflozin, sotagliflozin
   - beta-blocker* → metoprolol, carvedilol, bisoprolol, atenolol
   - ACE inhibitor* → enalapril, lisinopril, ramipril, captopril
   (다른 계열도 같은 방식으로 확장)

4. 전체 구조
   (P 그룹) AND (I 그룹) AND (O 그룹)
   인구 한정자(성인, 소아 등)는 별도 AND 그룹으로 추가

5. 연구 설계 필터는 cautions에 제안
   - 치료 효과 → AND ("Randomized Controlled Trial"[pt] OR "Meta-Analysis"[pt])
   - 관찰/상관 → AND ("Cohort Studies"[MeSH Terms] OR "Observational Study"[pt])
   - 진단 → AND ("Sensitivity and Specificity"[MeSH Terms])

규칙:
- PubMed를 실시간으로 검색한다고 주장하지 마세요.
- 어떤 데이터베이스도 실시간으로 검색한다고 주장하지 마세요.
- 논문 수나 특정 논문을 지어내지 마세요.
- 통제어 후보는 데이터베이스에 맞게 제시하고 confidence를 정직하게 평가하세요.
- 식별 가능한 환자 정보가 있으면 cautions에 익명화 안내를 포함하세요.
- query 필드는 영어 검색식으로 작성하세요.
- explanation의 reason, meshTerms의 note, cautions는 반드시 한국어로 작성하세요.
- JSON만 반환하세요. markdown fence, 설명 문장, 머리말 없이.

반환 형식:
{
  "query": "string",
  "explanation": [{ "part": "string", "reason": "string" }],
  "meshTerms": [{ "term": "string", "confidence": "high | medium | low", "note": "string" }],
  "cautions": ["string"]
}
`.trim();

export function buildSearchMessages(
  databaseId: SearchDatabaseId,
  question: string
): ChatMessage[] {
  const database = getSearchDatabase(databaseId);
  return [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\n${DATABASE_GUIDANCE[databaseId]}`,
    },
    {
      role: "user",
      content: `다음 연구 질문을 ${database.label} 검색식 초안으로 변환하세요.\n\n${question.trim()}`,
    },
  ];
}

export function buildPubMedMessages(question: string): ChatMessage[] {
  return buildSearchMessages("pubmed", question);
}
