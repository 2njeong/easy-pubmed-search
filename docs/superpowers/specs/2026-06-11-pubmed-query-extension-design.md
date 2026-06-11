# PubMed Query Extension MVP Design

## Goal

Build a Chrome extension that helps medical users translate natural-language research intent into a PubMed search query. The extension is not a literature search engine and does not claim to know the newest papers. Its primary job is to draft PubMed syntax, explain that syntax, and suggest possible MeSH terms for user review.

## Product Scope

The MVP is a toolbar popup extension. It does not inject UI into PubMed pages, automatically run searches, or modify PubMed DOM. Users copy the generated query and paste it into PubMed themselves.

The MVP supports local LLM runtimes:

- Ollama, default endpoint `http://localhost:11434`
- LM Studio, default endpoint `http://localhost:1234/v1`

OpenAI, Claude, Gemini, OpenRouter, and institutional LLM endpoints are intentionally out of MVP scope, but the provider interface must allow adding them later.

## Core User Flow

1. User installs the Chrome extension.
2. First launch shows local LLM onboarding.
3. User chooses Ollama or LM Studio.
4. Extension shows setup guidance, recommended model sizes, and default endpoint.
5. User tests the connection.
6. If connection succeeds, user enters a natural-language research question.
7. Extension sends the prompt to the selected local provider.
8. Extension displays a PubMed query draft, syntax explanation, MeSH term candidates, and cautions.
9. User copies the query and manually searches PubMed.

## First-Run Onboarding

The onboarding screen is required because the extension does not bundle a local LLM. Users must install and run either Ollama or LM Studio separately.

The onboarding must include:

- Provider selector: Ollama or LM Studio
- Short explanation that Ollama and LM Studio are local LLM runtimes, not models
- Setup steps for each provider
- Recommended model guidance:
  - 4B class for low-resource machines
  - 7B or 8B class for most laptops
  - 12B to 14B class for better quality when hardware allows
- Suggested model families: Gemma, Qwen, Llama, Mistral
- Endpoint field with provider-specific default
- Model name field
- Connection test button
- Clear success and failure messages

Failure messages should distinguish:

- Provider server is not running
- Endpoint is unreachable
- Model name is missing or unavailable
- Response format is invalid
- Browser or extension permission blocked the request

## Main Popup

The main popup is compact but complete. It contains:

- Provider status indicator
- Settings entry point
- Natural-language input area
- Generate button
- Loading state
- Generated PubMed query output
- Copy query button
- Syntax explanation section
- MeSH candidates section
- Cautions section

The popup should make the generated query the primary result. Explanation and MeSH candidates support trust and review, but should not visually compete with the query.

## LLM Output Contract

The extension asks the LLM for structured JSON and validates the result before rendering. The expected shape is:

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

The system prompt must explicitly say:

- Do not claim to search PubMed in real time.
- Do not invent paper counts or newest papers.
- Treat MeSH terms as candidates unless verified.
- Prefer PubMed-compatible field tags such as `[Title/Abstract]`, `[MeSH Terms]`, `[Publication Type]`, and date filters when relevant.
- Preserve important clinical concepts from the user input.
- Return JSON only.

If JSON parsing fails, the UI should show a readable error and keep the raw response behind a small expandable debug section for troubleshooting.

## Provider Architecture

Use a provider interface with a single generation capability:

```ts
interface LlmProvider {
  id: "ollama" | "lmstudio";
  testConnection(config: ProviderConfig): Promise<ConnectionResult>;
  generatePubMedQuery(input: GenerateInput, config: ProviderConfig): Promise<GeneratedQuery>;
}
```

Ollama implementation:

- Calls the local Ollama chat API.
- Uses endpoint default `http://localhost:11434`.
- Sends the configured model name.
- Requests non-streaming structured output.

LM Studio implementation:

- Calls OpenAI-compatible chat completions.
- Uses endpoint default `http://localhost:1234/v1`.
- Sends the configured model name.
- Requests non-streaming structured output.

## Storage

Use `chrome.storage.local` for provider configuration and onboarding completion state. Store:

- Selected provider
- Endpoint
- Model name
- Whether onboarding is complete
- Last successful connection timestamp

Do not store patient information or generated prompts beyond the current popup session in the MVP.

## Privacy And Safety

The extension should default to local runtimes and communicate that prompts are sent to the selected local endpoint. It should not send queries to any remote API in the MVP.

The UI should discourage entering identifiable patient information. The product is a search-query drafting assistant, not a clinical decision tool.

Generated output must be copy-only. The extension does not automatically submit PubMed searches in the MVP.

## Error Handling

Errors should be user-facing and actionable:

- "Ollama is not reachable. Open Ollama and try again."
- "LM Studio local server is not reachable. Start the server in LM Studio."
- "The model did not return valid JSON. Try again or choose a stronger model."
- "No model name is configured. Add the model name in settings."

Developer-level details may be available in a collapsible section but should not dominate the user experience.

## Testing Strategy

Unit tests:

- Provider config defaults
- LLM response parsing
- Validation of malformed JSON
- Prompt construction
- Error classification

Integration-style tests:

- Mock Ollama response
- Mock LM Studio response
- Onboarding completion and stored settings
- Generate flow with success and failure states

Manual verification:

- Load unpacked extension in Chrome
- Complete onboarding for Ollama
- Complete onboarding for LM Studio
- Generate query from a representative clinical question
- Copy query output
- Confirm no automatic PubMed navigation or DOM modification occurs

## Out Of Scope For MVP

- PubMed page DOM injection
- Automatic PubMed search execution
- Real-time PubMed result retrieval
- Verified MeSH lookup through NLM APIs
- Cloud LLM providers
- User accounts or sync
- Query history

## Future Extensions

- PubMed page side panel
- NLM MeSH lookup integration
- PubMed result count preview
- OpenAI, Claude, Gemini, OpenRouter, and institutional provider support
- Query history with explicit user opt-in
- Korean and English prompt templates
