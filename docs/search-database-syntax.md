# 검색 데이터베이스 문법 기준

이 문서는 프롬프트와 테스트를 검수하기 위한 기준입니다. 앱이 LLM에 매번 이 문서 전체를 보내지는 않습니다.

## 공통 원칙

- 사용자의 한국어 연구질문을 영어 검색식 초안으로 변환한다.
- PICO 요소는 가능한 한 별도 OR 그룹으로 만들고, 그룹 사이에는 AND를 사용한다.
- 사용자가 제외 조건을 말하면 별도 AND NOT 그룹으로 만든다.
- Boolean 연산자 AND, OR, NOT은 대문자로 작성한다.
- 와일드카드는 너무 짧은 어간에 붙이지 않는다.
- 논문 수, 실제 검색 결과, 특정 논문 존재 여부를 지어내지 않는다.
- 연구 설계 필터는 검색식 본문에 무리하게 넣기보다 확인사항에서 제안한다.

## PubMed

- 통제어: MeSH
- MeSH: `"Heart Failure"[MeSH Terms]`
- 제목/초록: `"heart failure"[Title/Abstract]` 또는 `heart failure[tiab]`
- 출판 유형: `"Randomized Controlled Trial"[pt]`
- PubMed 전용 태그는 PubMed 검색식에만 사용한다.
- 확실하지 않은 MeSH 용어는 검색식 본문에 넣지 않고 후보/확인사항으로만 제안한다.
- `[Filter]`는 질환, 증상, 제외 키워드용 필드로 사용하지 않는다.
- publication type 필드에는 와일드카드를 붙이지 않는다.

예시:

```text
("Heart Failure"[MeSH Terms] OR "heart failure"[Title/Abstract])
AND
("SGLT2 inhibitor*"[Title/Abstract] OR empagliflozin[Title/Abstract])
```

## CINAHL

- 통제어: CINAHL Headings
- 주제어: `MH "Heart Failure"` 또는 하위 용어 포함 시 `MH "Heart Failure+"`
- 제목: `TI "heart failure"`
- 초록: `AB "heart failure"`
- PubMed 태그인 `[MeSH Terms]`, `[Title/Abstract]`, `[pt]`는 사용하지 않는다.

예시:

```text
(MH "Heart Failure+" OR TI "heart failure" OR AB "heart failure")
AND
(TI "SGLT2 inhibitor*" OR AB "SGLT2 inhibitor*" OR TI empagliflozin OR AB empagliflozin)
```

## Web of Science

- 통제어가 없다.
- 기본 검색 필드: `TS=(...)`
- 제목 검색: `TI=(...)`
- 저자 키워드: `AK=(...)`
- MeSH, CINAHL Headings, Emtree 문법을 사용하지 않는다.
- `controlledVocabTerms`는 기본적으로 빈 배열이어야 한다.

예시:

```text
TS=("heart failure" OR "cardiac failure")
AND
TS=("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin)
```

## Cochrane Library

- 통제어: MeSH descriptor
- MeSH descriptor: `[mh "Heart Failure"]`
- 제목/초록/키워드: `:ti,ab,kw`
- 인접어: `NEAR/n`
- PubMed의 `[MeSH Terms]`, `[Title/Abstract]`, `[pt]` 형식은 사용하지 않는다.

예시:

```text
([mh "Heart Failure"] OR ("heart failure" OR "cardiac failure"):ti,ab,kw)
AND
("SGLT2 inhibitor*" OR empagliflozin OR dapagliflozin):ti,ab,kw
```

## EMBASE

- 통제어: Emtree
- 폭넓은 Emtree 검색: `'heart failure'/exp`
- 제목/초록: `'heart failure':ti,ab`
- PubMed 태그인 `[MeSH Terms]`, `[Title/Abstract]`, `[pt]`는 사용하지 않는다.
- EMBASE 플랫폼이 Ovid인지 Embase.com인지에 따라 세부 문법 차이가 있을 수 있으므로 확인사항에 안내한다.

예시:

```text
('heart failure'/exp OR 'heart failure':ti,ab OR 'cardiac failure':ti,ab)
AND
('SGLT2 inhibitor*':ti,ab OR empagliflozin:ti,ab OR dapagliflozin:ti,ab)
```

## 프롬프트 설계 메모

- 이 문서 전체를 시스템 프롬프트에 넣지 않는다.
- LLM에는 DB별 핵심 문법과 JSON 예시 1개만 제공한다.
- non-PubMed 데이터베이스에는 PubMed 전용 JSON 예시가 섞이지 않아야 한다.
- 파서와 검증 로직은 LLM이 실수로 다른 DB 문법을 섞었을 때 사용자에게 확인사항을 보여준다.
