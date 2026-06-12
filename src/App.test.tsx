import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders onboarding copy before setup is complete", async () => {
    render(<App />);

    expect(await screen.findByText("로컬 LLM 연결 설정")).toBeInTheDocument();
    expect(screen.getByText("Ollama 준비")).toBeInTheDocument();
    expect(screen.getByText("Ollama 설치 페이지 열기")).toBeInTheDocument();
    expect(screen.getByDisplayValue("llama3.2:latest")).toBeInTheDocument();
  });
});
