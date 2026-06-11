# PubMed 검색식 생성 크롬 익스텐션 MVP 설계

## 목표

의료 사용자가 자연어로 작성한 연구 질문이나 검색 의도를 PubMed 검색식으로 변환하는 크롬 익스텐션을 만든다. 이 익스텐션은 최신 논문을 직접 찾아주는 문헌 검색 엔진이 아니며, 최신 논문 정보를 알고 있다고 주장하지 않는다. 핵심 역할은 PubMed 검색 문법에 맞는 초안을 만들고, 그 문법을 설명하며, 사용자가 검토할 수 있는 MeSH 후보를 제안하는 것이다.

## 제품 범위

MVP는 크롬 툴바 팝업 형태의 익스텐션이다. PubMed 페이지에 UI를 삽입하지 않고, 검색을 자동 실행하지 않으며, PubMed DOM을 수정하지 않는다. 사용자는 생성된 검색식을 복사한 뒤 PubMed에 직접 붙여넣어 검색한다.

MVP는 다음 로컬 LLM 런타임을 지원한다.

- Ollama, 기본 endpoint `http://localhost:11434`
- LM Studio, 기본 endpoint `http://localhost:1234/v1`

OpenAI, Claude, Gemini, OpenRouter, 기관 내부 LLM endpoint는 MVP 범위에서 제외한다. 다만 이후 provider를 추가할 수 있도록 내부 provider interface는 확장 가능하게 설계한다.

## 핵심 사용자 흐름

1. 사용자가 크롬 익스텐션을 설치한다.
2. 첫 실행 시 로컬 LLM 온보딩 화면을 보여준다.
3. 사용자가 Ollama 또는 LM Studio를 선택한다.
4. 익스텐션이 설치 안내, 추천 모델 크기, 기본 endpoint를 보여준다.
5. 사용자가 연결 테스트를 실행한다.
6. 연결이 성공하면 사용자가 자연어 연구 질문을 입력한다.
7. 익스텐션이 선택된 로컬 provider로 프롬프트를 보낸다.
8. 익스텐션이 PubMed 검색식 초안, 문법 설명, MeSH 후보, 주의사항을 표시한다.
9. 사용자가 검색식을 복사해서 PubMed에서 직접 검색한다.

## 첫 실행 온보딩

익스텐션은 로컬 LLM을 포함하지 않으므로 온보딩 화면이 필수다. 사용자는 Ollama 또는 LM Studio를 별도로 설치하고 실행해야 한다.

온보딩에는 다음 항목이 포함되어야 한다.

- Provider 선택: Ollama 또는 LM Studio
- Ollama와 LM Studio는 모델이 아니라 로컬 LLM 런타임이라는 짧은 설명
- provider별 설치 및 실행 안내
- 추천 모델 안내:
  - 저사양 기기: 4B급 모델
  - 일반 노트북: 7B 또는 8B급 모델
  - 성능 여유가 있는 환경: 12B-14B급 모델
- 추천 모델 계열: Gemma, Qwen, Llama, Mistral
- provider별 기본값이 들어간 endpoint 입력 필드
- 모델명 입력 필드
- 연결 테스트 버튼
- 명확한 성공 및 실패 메시지

실패 메시지는 다음 상황을 구분해야 한다.

- provider 서버가 실행 중이 아님
- endpoint에 접근할 수 없음
- 모델명이 비어 있거나 사용할 수 없음
- 응답 형식이 올바르지 않음
- 브라우저 또는 익스텐션 권한 때문에 요청이 차단됨

## 메인 팝업

메인 팝업은 작지만 필요한 기능을 모두 갖춘다. 포함 요소는 다음과 같다.

- Provider 상태 표시
- 설정 진입 버튼
- 자연어 입력 영역
- 생성 버튼
- 로딩 상태
- 생성된 PubMed 검색식 출력
- 검색식 복사 버튼
- 문법 설명 섹션
- MeSH 후보 섹션
- 주의사항 섹션

팝업에서는 생성된 검색식이 가장 중요한 결과로 보여야 한다. 문법 설명과 MeSH 후보는 신뢰와 검토를 돕는 보조 정보이며, 검색식보다 시각적으로 더 강하게 보이면 안 된다.

## LLM 응답 계약

익스텐션은 LLM에 구조화된 JSON 응답을 요청하고, 렌더링 전에 응답을 검증한다. 기대하는 형태는 다음과 같다.

```json
{
  "query": "string",
  "explanation": [
    {
      "part": "string",
      "reason": "string"
    }
  ],
  "meshTerms": [
    {
      "term": "string",
      "confidence": "high | medium | low",
      "note": "string"
    }
  ],
  "cautions": ["string"]
}
```

시스템 프롬프트에는 다음 내용을 명시해야 한다.

- PubMed를 실시간으로 검색한다고 주장하지 않는다.
- 논문 개수나 최신 논문 정보를 지어내지 않는다.
- MeSH 용어는 검증된 사실이 아니라 후보로 취급한다.
- 필요할 때 `[Title/Abstract]`, `[MeSH Terms]`, `[Publication Type]`, 날짜 필터 등 PubMed 호환 필드 태그를 우선 사용한다.
- 사용자가 입력한 중요한 임상 개념을 보존한다.
- JSON만 반환한다.

JSON 파싱에 실패하면 UI는 사용자가 이해할 수 있는 오류를 표시하고, 문제 해결을 위해 원본 응답을 작은 접이식 디버그 영역에 보관한다.

## Provider 아키텍처

provider interface는 하나의 생성 기능을 중심으로 둔다.

```ts
interface LlmProvider {
  id: "ollama" | "lmstudio";
  testConnection(config: ProviderConfig): Promise<ConnectionResult>;
  generatePubMedQuery(input: GenerateInput, config: ProviderConfig): Promise<GeneratedQuery>;
}
```

Ollama 구현:

- 로컬 Ollama chat API를 호출한다.
- 기본 endpoint는 `http://localhost:11434`를 사용한다.
- 설정된 모델명을 보낸다.
- non-streaming 구조화 응답을 요청한다.

LM Studio 구현:

- OpenAI-compatible chat completions API를 호출한다.
- 기본 endpoint는 `http://localhost:1234/v1`를 사용한다.
- 설정된 모델명을 보낸다.
- non-streaming 구조화 응답을 요청한다.

## 저장 방식

provider 설정과 온보딩 완료 상태는 `chrome.storage.local`에 저장한다. 저장 항목은 다음과 같다.

- 선택된 provider
- Endpoint
- 모델명
- 온보딩 완료 여부
- 마지막 연결 성공 시각

MVP에서는 환자 정보나 생성 프롬프트를 현재 팝업 세션 밖에 저장하지 않는다.

## 개인정보 및 안전

익스텐션은 로컬 런타임을 기본값으로 하며, 프롬프트가 선택된 로컬 endpoint로 전송된다는 점을 사용자에게 알린다. MVP에서는 어떤 원격 API에도 검색어나 프롬프트를 보내지 않는다.

UI는 식별 가능한 환자 정보를 입력하지 않도록 안내해야 한다. 이 제품은 검색식 초안 작성 도구이며, 임상 의사결정 도구가 아니다.

생성 결과는 복사만 가능하게 한다. MVP에서는 PubMed 검색을 자동 제출하지 않는다.

## 오류 처리

오류 메시지는 사용자가 다음 행동을 알 수 있게 작성한다.

- "Ollama에 연결할 수 없습니다. Ollama를 실행한 뒤 다시 시도하세요."
- "LM Studio 로컬 서버에 연결할 수 없습니다. LM Studio에서 Local Server를 시작하세요."
- "모델이 올바른 JSON을 반환하지 않았습니다. 다시 시도하거나 더 강한 모델을 선택하세요."
- "모델명이 설정되어 있지 않습니다. 설정에서 모델명을 입력하세요."

개발자용 세부 정보는 접이식 영역에 둘 수 있지만, 사용자 경험의 중심에 두지 않는다.

## 테스트 전략

단위 테스트:

- provider 설정 기본값
- LLM 응답 파싱
- 잘못된 JSON 검증
- 프롬프트 생성
- 오류 분류

통합 성격의 테스트:

- Ollama mock 응답
- LM Studio mock 응답
- 온보딩 완료 및 설정 저장
- 성공 및 실패 상태가 포함된 검색식 생성 흐름

수동 검증:

- Chrome에서 unpacked extension으로 로드
- Ollama 온보딩 완료
- LM Studio 온보딩 완료
- 대표적인 임상 질문으로 검색식 생성
- 검색식 복사
- PubMed 자동 이동이나 DOM 수정이 발생하지 않는지 확인

## MVP 범위 제외

- PubMed 페이지 DOM 삽입
- PubMed 검색 자동 실행
- 실시간 PubMed 결과 조회
- NLM API를 통한 검증된 MeSH 조회
- 클라우드 LLM provider
- 사용자 계정 또는 동기화
- 검색 기록

## 향후 확장

- PubMed 페이지 사이드패널
- NLM MeSH 조회 연동
- PubMed 결과 개수 미리보기
- OpenAI, Claude, Gemini, OpenRouter, 기관 내부 provider 지원
- 사용자 명시적 동의 기반 검색 기록
- 한국어 및 영어 프롬프트 템플릿
