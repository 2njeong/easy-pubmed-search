# Easy PubMed Search

자연어 연구 질문을 PubMed 검색식 초안으로 변환하는 크롬 익스텐션입니다.

## MVP 범위

- 크롬 side panel
- Ollama 및 LM Studio 로컬 LLM 지원
- PubMed 검색식 생성
- 문법 설명
- MeSH 후보 제안
- 검색식 복사

MVP는 PubMed 페이지에 UI를 삽입하지 않고, 검색을 자동 실행하지 않습니다.

## 로컬 LLM 준비

이 익스텐션은 LLM을 포함하지 않습니다. 사용자는 Ollama 또는 LM Studio를 별도로 설치하고 모델을 실행해야 합니다.

### Ollama

- 기본 endpoint: `http://localhost:11434`
- 설치: <https://ollama.com/download>
- 추천 모델 예시: `gemma4:latest`, `gemma3`, `qwen3`
- Chrome 익스텐션에서 Ollama를 쓰려면 `OLLAMA_ORIGINS`에 `chrome-extension://*` 접근을 허용해야 합니다.

### LM Studio

- 기본 endpoint: `http://localhost:1234/v1`
- 설치: <https://lmstudio.ai/download>
- LM Studio에서 Local Server를 켠 뒤 모델명을 입력합니다.

## 개발

```bash
pnpm install
pnpm dev
```

## 빌드

```bash
pnpm build
```

빌드 결과물은 `dist/`에 생성됩니다. Chrome의 `chrome://extensions`에서 Developer mode를 켠 뒤 `dist/`를 unpacked extension으로 로드합니다.

## 테스트

```bash
pnpm test
```
