import type { ChatMessage, SearchDatabase, SearchDatabaseId } from "../types";

export const SEARCH_DATABASES: SearchDatabase[] = [
  {
    id: "pubmed",
    label: "PubMed",
    controlledVocabulary: "MeSH",
    searchNote: "MeSH와 제목/초록 필드를 함께 사용합니다.",
  },
  {
    id: "cinahl",
    label: "CINAHL",
    controlledVocabulary: "CINAHL Headings",
    searchNote: "CINAHL Headings(MH), 제목(TI), 초록(AB) 필드를 사용합니다.",
  },
  {
    id: "webOfScience",
    label: "Web of Science",
    controlledVocabulary: "주요 용어",
    searchNote: "통제어 없이 TS= Topic Search 중심으로 구성합니다.",
  },
  {
    id: "cochrane",
    label: "Cochrane",
    controlledVocabulary: "MeSH",
    searchNote: "MeSH descriptor와 제목/초록/키워드(:ti,ab,kw)를 함께 사용합니다.",
  },
  {
    id: "embase",
    label: "EMBASE",
    controlledVocabulary: "Emtree",
    searchNote: "Emtree 용어와 제목/초록(:ti,ab) 필드를 함께 사용합니다.",
  },
];

export function getSearchDatabase(id: SearchDatabaseId): SearchDatabase {
  return SEARCH_DATABASES.find((database) => database.id === id) ?? SEARCH_DATABASES[0];
}

const DRUG_CLASS_CONTEXT = `
내장 약물 계열 사전:
- SGLT2 inhibitor: empagliflozin, dapagliflozin, canagliflozin, ertugliflozin, sotagliflozin
- GLP-1 receptor agonist: semaglutide, liraglutide, dulaglutide, exenatide, lixisenatide, tirzepatide
- beta-blocker: metoprolol, carvedilol, bisoprolol, atenolol, propranolol, nebivolol
- ACE inhibitor: enalapril, lisinopril, ramipril, captopril, perindopril
- ARB: losartan, valsartan, candesartan, irbesartan, telmisartan, olmesartan
- statin: atorvastatin, rosuvastatin, simvastatin, pravastatin, pitavastatin
- anticoagulant: warfarin, apixaban, rivaroxaban, dabigatran, edoxaban
- P2Y12 inhibitor: clopidogrel, prasugrel, ticagrelor
- SSRI: fluoxetine, sertraline, escitalopram, paroxetine, citalopram, fluvoxamine
- inhaled corticosteroid: budesonide, fluticasone, beclomethasone, mometasone, ciclesonide

약물 계열 확장 규칙:
- 위 사전에 있는 계열은 이 목록을 우선 사용하세요.
- 목록에 없는 약물 계열은 모델 지식으로 확장할 수 있지만, controlledVocabTerms나 explanation에서 확실하게 단정하지 말고 confidence를 medium 이하로 표기하세요.
- 최신 약물이나 불확실한 성분명은 cautions에 검토 필요 문구를 포함하세요.
`.trim();

const DATABASE_GUIDANCE: Record<SearchDatabaseId, string> = {
  pubmed: `
대상 데이터베이스: PubMed
- MeSH 공식 용어가 확실한 경우에만 "Term"[MeSH Terms] 형식으로 작성하세요.
- 확실하지 않은 MeSH 용어는 query 본문에 넣지 말고 controlledVocabTerms 후보나 cautions에만 제안하세요.
- 제목/초록 검색은 term[Title/Abstract] 또는 term[tiab] 형식으로 작성하세요.
- [Filter]를 임상 키워드 필드로 사용하지 마세요. 질환, 증상, 제외 키워드는 [Title/Abstract]를 사용하세요.
- publication type에는 와일드카드를 붙이지 마세요. 필요한 경우 "Randomized Controlled Trial"[pt]처럼 정확한 publication type만 사용하세요.
- 연구설계 필터는 사용자가 명시적으로 요청한 경우가 아니면 query에 넣지 말고 cautions에 제안하세요.
- Boolean 연산자 AND, OR, NOT은 반드시 대문자로 작성하세요.
- PubMed 와일드카드는 최소 4글자 이상의 어간 뒤에만 사용하세요. 너무 짧은 truncation 예: card*는 피하고 cardi*처럼 더 구체화하세요.

좋은 PubMed 예시:
("Heart Failure"[MeSH Terms] OR "heart failure"[Title/Abstract])
AND
("Sodium-Glucose Transporter 2 Inhibitors"[MeSH Terms] OR "SGLT2 inhibitor*"[Title/Abstract] OR empagliflozin[Title/Abstract] OR dapagliflozin[Title/Abstract])
AND
(hospitalization*[Title/Abstract] OR admission*[Title/Abstract])
`.trim(),
  cinahl: `
대상 데이터베이스: CINAHL
- 다른 데이터베이스 문법을 섞지 마세요.
- CINAHL Headings 후보를 우선 고려하세요.
- 주제어는 MH "Term" 형식을 사용하세요. 폭넓은 하위 용어가 필요하면 MH "Term+" 형식을 제안할 수 있습니다.
- 제목/초록 검색은 TI term 또는 AB term 형식을 사용하세요.
- PubMed의 대괄호 필드 태그나 publication type 태그는 CINAHL 검색식에 넣지 마세요.
- Web of Science의 TS=, Cochrane의 descriptor/near 문법, EMBASE의 /exp 문법은 넣지 마세요.
- Boolean 연산자 AND, OR, NOT은 반드시 대문자로 작성하세요.

좋은 CINAHL 예시:
(MH "Heart Failure+" OR TI "heart failure" OR AB "heart failure")
AND
(MH "Sodium-Glucose Transporter 2 Inhibitors" OR TI "SGLT2 inhibitor*" OR AB "SGLT2 inhibitor*" OR TI empagliflozin OR AB empagliflozin)
AND
(TI hospitalization* OR AB hospitalization* OR TI admission* OR AB admission*)
`.trim(),
  webOfScience: `
대상 데이터베이스: Web of Science
- 다른 데이터베이스 문법을 섞지 마세요.
- 통제어가 없으므로 Topic Search 중심으로 작성하세요.
- 주제 검색은 TS=(term OR "phrase") 형식을 사용하세요.
- 제목만 필요한 경우 TI=, 저자 키워드는 AK=를 사용할 수 있지만 기본은 TS=로 작성하세요.
- PubMed의 MeSH 필드, CINAHL Headings, Cochrane descriptor, EMBASE Emtree 문법은 사용하지 마세요.
- controlledVocabTerms는 빈 배열로 두세요. 단, 사용자가 키워드 후보를 명시적으로 원하면 AK=에 넣을 수 있는 저자 키워드 후보를 confidence low로 제안하세요.
- Boolean 연산자 AND, OR, NOT은 반드시 대문자로 작성하세요.

좋은 Web of Science 예시:
TS=("heart failure" OR "cardiac failure")
AND
TS=("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin)
AND
TS=(hospitalization* OR admission*)
`.trim(),
  cochrane: `
대상 데이터베이스: Cochrane Library
- 다른 데이터베이스 문법을 섞지 마세요.
- Cochrane 검색 인터페이스에서 쓸 수 있는 검색식으로 작성하세요.
- MeSH descriptor는 [mh "Term"] 형식을 사용하세요.
- 제목/초록/키워드는 :ti,ab,kw 형식을 사용하세요.
- 인접어가 필요하면 NEAR/n을 사용할 수 있습니다.
- PubMed의 대괄호 필드 태그, CINAHL의 MH/TI/AB, Web of Science의 TS=, EMBASE의 /exp 문법은 넣지 마세요.
- Boolean 연산자 AND, OR, NOT은 반드시 대문자로 작성하세요.

좋은 Cochrane 예시:
([mh "Heart Failure"] OR ("heart failure" OR "cardiac failure"):ti,ab,kw)
AND
([mh "Sodium-Glucose Transporter 2 Inhibitors"] OR ("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin):ti,ab,kw)
AND
(hospitalization* OR admission*):ti,ab,kw
`.trim(),
  embase: `
대상 데이터베이스: EMBASE
- 다른 데이터베이스 문법을 섞지 마세요.
- Emtree 용어 후보를 우선 고려하세요.
- Emtree 폭넓은 검색은 'term'/exp 형식을 사용하세요.
- 제목/초록 검색은 term:ti,ab 형식을 사용하세요.
- PubMed의 대괄호 필드 태그나 publication type 태그는 사용하지 마세요.
- CINAHL의 MH/TI/AB, Web of Science의 TS=, Cochrane의 descriptor/near 문법은 넣지 마세요.
- Boolean 연산자 AND, OR, NOT은 반드시 대문자로 작성하세요.

좋은 EMBASE 예시:
('heart failure'/exp OR 'heart failure':ti,ab OR 'cardiac failure':ti,ab)
AND
('sodium glucose cotransporter 2 inhibitor'/exp OR 'SGLT2 inhibitor*':ti,ab OR empagliflozin:ti,ab OR dapagliflozin:ti,ab)
AND
(hospitalization*:ti,ab OR admission*:ti,ab)
`.trim(),
};

const DATABASE_JSON_EXAMPLES: Record<SearchDatabaseId, string> = {
  pubmed: `
좋은 PubMed JSON 예시:
{
  "query": "(\\"Heart Failure\\"[MeSH Terms] OR \\"heart failure\\"[Title/Abstract] OR \\"cardiac failure\\"[Title/Abstract])\\nAND\\n(\\"Sodium-Glucose Transporter 2 Inhibitors\\"[MeSH Terms] OR \\"SGLT2 inhibitor*\\"[Title/Abstract] OR empagliflozin[Title/Abstract] OR dapagliflozin[Title/Abstract])\\nAND\\n(hospitalization*[Title/Abstract] OR admission*[Title/Abstract])",
  "explanation": [
    { "part": "heart failure group", "reason": "대상 질환을 MeSH와 제목/초록 동의어로 넓게 검색합니다." },
    { "part": "SGLT2 inhibitor group", "reason": "약물 계열명과 대표 성분명을 함께 OR로 확장했습니다." },
    { "part": "hospitalization group", "reason": "입원 결과를 제목/초록 키워드로 검색합니다." }
  ],
  "controlledVocabTerms": [
    { "term": "Heart Failure", "confidence": "high", "note": "PubMed MeSH 질환 후보입니다." },
    { "term": "Sodium-Glucose Transporter 2 Inhibitors", "confidence": "medium", "note": "약물 계열 MeSH 후보이며 실제 PubMed에서 확인이 필요합니다." }
  ],
  "cautions": ["통제어 후보는 실제 데이터베이스에서 확인하세요.", "치료 효과 질문이면 RCT 또는 체계적 문헌고찰 필터를 추가할 수 있습니다."]
}
`.trim(),
  cinahl: `
좋은 CINAHL JSON 예시:
{
  "query": "(MH \\"Heart Failure+\\" OR TI \\"heart failure\\" OR AB \\"heart failure\\")\\nAND\\n(MH \\"Sodium-Glucose Transporter 2 Inhibitors\\" OR TI \\"SGLT2 inhibitor*\\" OR AB \\"SGLT2 inhibitor*\\" OR TI empagliflozin OR AB empagliflozin)\\nAND\\n(TI hospitalization* OR AB hospitalization* OR TI admission* OR AB admission*)",
  "explanation": [
    { "part": "heart failure group", "reason": "CINAHL Headings와 제목/초록 동의어를 함께 사용합니다." },
    { "part": "SGLT2 inhibitor group", "reason": "계열명과 성분명을 TI/AB 필드로 확장했습니다." }
  ],
  "controlledVocabTerms": [
    { "term": "Heart Failure", "confidence": "medium", "note": "CINAHL Headings 후보이며 실제 CINAHL에서 확인이 필요합니다." }
  ],
  "cautions": ["CINAHL Headings는 실제 데이터베이스에서 확인하세요."]
}
`.trim(),
  webOfScience: `
좋은 Web of Science JSON 예시:
{
  "query": "TS=(\\"heart failure\\" OR \\"cardiac failure\\")\\nAND\\nTS=(\\"SGLT2 inhibitor*\\" OR empagliflozin OR dapagliflozin)\\nAND\\nTS=(hospitalization* OR admission*)",
  "explanation": [
    { "part": "heart failure topic", "reason": "Web of Science는 통제어가 없으므로 TS= topic field로 질환 동의어를 검색합니다." },
    { "part": "SGLT2 inhibitor topic", "reason": "약물 계열명과 성분명을 TS=로 확장했습니다." }
  ],
  "controlledVocabTerms": [],
  "cautions": ["Web of Science에는 MeSH나 Emtree 같은 통제어가 없으므로 TS= 검색식을 실제 화면에서 확인하세요."]
}
`.trim(),
  cochrane: `
좋은 Cochrane JSON 예시:
{
  "query": "([mh \\"Heart Failure\\"] OR (\\"heart failure\\" OR \\"cardiac failure\\"):ti,ab,kw)\\nAND\\n([mh \\"Sodium-Glucose Transporter 2 Inhibitors\\"] OR (\\"SGLT2 inhibitor*\\" OR empagliflozin OR dapagliflozin):ti,ab,kw)\\nAND\\n(hospitalization* OR admission*):ti,ab,kw",
  "explanation": [
    { "part": "heart failure group", "reason": "Cochrane MeSH descriptor와 제목/초록/키워드 검색을 함께 사용합니다." }
  ],
  "controlledVocabTerms": [
    { "term": "Heart Failure", "confidence": "medium", "note": "Cochrane MeSH descriptor 후보입니다." }
  ],
  "cautions": ["Cochrane Advanced Search에서 라인별로 나눠 검토할 수 있습니다."]
}
`.trim(),
  embase: `
좋은 EMBASE JSON 예시:
{
  "query": "('heart failure'/exp OR 'heart failure':ti,ab OR 'cardiac failure':ti,ab)\\nAND\\n('sodium glucose cotransporter 2 inhibitor'/exp OR 'SGLT2 inhibitor*':ti,ab OR empagliflozin:ti,ab OR dapagliflozin:ti,ab)\\nAND\\n(hospitalization*:ti,ab OR admission*:ti,ab)",
  "explanation": [
    { "part": "heart failure group", "reason": "Emtree 폭넓은 검색과 제목/초록 동의어를 함께 사용합니다." }
  ],
  "controlledVocabTerms": [
    { "term": "heart failure", "confidence": "medium", "note": "Emtree 후보이며 실제 EMBASE에서 확인이 필요합니다." }
  ],
  "cautions": ["EMBASE 플랫폼이 Ovid인지 Embase.com인지에 따라 문법을 확인하세요."]
}
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
   아래 내장 약물 계열 사전을 우선 사용하세요.

4. 전체 구조
   (P 그룹) AND (I 그룹) AND (O 그룹)
   인구 한정자(성인, 소아 등)는 별도 AND 그룹으로 추가

5. 제외 조건 처리
   사용자가 "제외", "빼고", "단 ... 제외"라고 말하면 별도 AND NOT 그룹으로 작성하세요.
   예) 임산부 제외 → AND NOT (pregnan* 또는 "pregnant women"를 현재 데이터베이스의 제목/초록/주제 필드 문법으로 작성)

6. Boolean과 와일드카드
   - Boolean 연산자 AND, OR, NOT은 항상 대문자로 작성하세요.
   - 와일드카드는 너무 짧은 어간에는 쓰지 마세요. 가능하면 4글자 이상의 명확한 어간 뒤에 붙이세요.
   - 구문은 큰따옴표로 묶고, 약어와 풀네임을 OR로 함께 제시하세요.

7. query 줄바꿈
   query 문자열에는 AND 그룹 사이에 \\n을 포함해 읽기 쉽게 작성하세요.
   JSON 바깥에 markdown fence나 설명 문장은 쓰지 마세요.

8. 연구 설계 필터는 cautions에 제안
   - 치료 효과, 관찰연구, 진단정확도, 체계적 문헌고찰 등은 현재 데이터베이스 문법에 맞는 필터를 cautions에만 제안하세요.
   - 현재 데이터베이스가 PubMed가 아니라면 PubMed 전용 publication type이나 MeSH 필터를 query에 넣지 마세요.

규칙:
- PubMed를 실시간으로 검색한다고 주장하지 마세요.
- 어떤 데이터베이스도 실시간으로 검색한다고 주장하지 마세요.
- 논문 수나 특정 논문을 지어내지 마세요.
- controlledVocabTerms 필드에는 현재 데이터베이스의 controlledVocabulary에 해당하는 용어 후보만 넣으세요.
- PubMed/Cochrane은 MeSH, CINAHL은 CINAHL Headings, EMBASE는 Emtree 후보입니다.
- Web of Science는 통제어가 없으므로 controlledVocabTerms는 기본적으로 빈 배열로 두세요.
- 통제어 후보의 confidence를 정직하게 평가하세요.
- 식별 가능한 환자 정보가 있으면 cautions에 익명화 안내를 포함하세요.
- query 필드는 영어 검색식으로 작성하세요.
- explanation의 reason, controlledVocabTerms의 note, cautions는 반드시 한국어로 작성하세요.
- JSON만 반환하세요. markdown fence, 설명 문장, 머리말 없이.

반환 형식:
{
  "query": "string",
  "explanation": [{ "part": "string", "reason": "string" }],
  "controlledVocabTerms": [{ "term": "string", "confidence": "high | medium | low", "note": "string" }],
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
      content: `${SYSTEM_PROMPT}\n\n${DRUG_CLASS_CONTEXT}\n\n${DATABASE_GUIDANCE[databaseId]}\n\n${DATABASE_JSON_EXAMPLES[databaseId]}`,
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
