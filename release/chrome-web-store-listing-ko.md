# Easy PubMed Search

## 한 줄 설명

자연어 연구 질문을 PubMed 검색식 초안으로 변환하는 로컬 LLM 기반 Chrome 확장 프로그램입니다.

## 자세한 설명

Easy PubMed Search는 의료인과 연구자가 PubMed 검색식을 더 쉽게 작성할 수 있도록 돕는 Chrome 확장 프로그램입니다.

한국어로 연구 질문을 입력하면, 로컬 Ollama 모델을 이용해 PubMed에서 바로 복사해 사용할 수 있는 영어 검색식 초안을 생성합니다. 검색식에 사용된 PubMed 문법, MeSH 후보, 주의사항도 함께 보여줍니다.

주요 기능:

- 자연어 연구 질문을 PubMed 검색식 초안으로 변환
- PubMed 문법 설명
- MeSH 후보 제안
- 검색식 복사
- 이전 검색 기록 확인
- Ollama 로컬 LLM 사용

이 확장 프로그램은 최신 논문을 직접 검색하거나 임상 결정을 대신하지 않습니다. 생성된 검색식은 사용자가 검토한 뒤 PubMed에서 직접 사용해야 합니다.

## 개인정보 처리 요약

Easy PubMed Search는 기본적으로 로컬 Ollama 서버에만 요청을 보냅니다. 원격 서버, 외부 API, 자체 서버로 사용자의 검색 질문을 전송하지 않습니다.

저장되는 정보:

- 사용자가 설정한 Ollama endpoint와 모델명
- 사용자가 생성한 검색 기록

저장 위치:

- Chrome 브라우저의 로컬 저장소(`chrome.storage.local`)

수집하지 않는 정보:

- 이름, 이메일, 계정 정보
- 결제 정보
- 웹 방문 기록
- 원격 서버로 전송되는 검색 데이터

주의:

사용자는 식별 가능한 환자 정보를 입력하지 않아야 합니다.

## 테스트 안내

테스트하려면 Ollama를 설치하고 로컬 서버를 실행해야 합니다.

1. Ollama 설치: https://ollama.com/download
2. 모델 설치: `ollama pull llama3.2`
3. Chrome extension origin 허용 및 로컬 전용 실행 설정
4. 확장 프로그램 side panel에서 연결 테스트
5. 자연어 연구 질문 입력 후 PubMed 검색식 생성
