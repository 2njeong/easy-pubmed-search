import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Generator } from "./Generator";
import type { StoredSettings } from "../types";

const settings: StoredSettings = {
  provider: "ollama",
  endpoint: "http://localhost:11434",
  model: "llama3.2:latest",
  onboardingComplete: true,
};

function mockFetchWithQueries() {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      messages?: Array<{ content: string }>;
    };
    const prompt = body.messages?.find((message) =>
      message.content.includes("검색식 초안")
    )?.content ?? "";
    const database = prompt.includes("CINAHL")
      ? "CINAHL"
      : prompt.includes("Web of Science")
        ? "Web of Science"
        : prompt.includes("Cochrane")
          ? "Cochrane"
          : prompt.includes("EMBASE")
            ? "EMBASE"
            : "PubMed";

    return new Response(JSON.stringify({
      message: {
        content: JSON.stringify({
          query: `${database} generated query`,
          explanation: [{ part: database, reason: `${database} 문법을 사용했습니다.` }],
          controlledVocabTerms: [],
          cautions: [],
        }),
      },
    }));
  });
}

describe("Generator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates database-specific results from tabs and preserves prior tab results", async () => {
    vi.stubGlobal("fetch", mockFetchWithQueries());

    render(<Generator settings={settings} onOpenSettings={() => undefined} />);

    fireEvent.change(screen.getByLabelText("연구 질문"), {
      target: { value: "노인 우울증 환자에서 운동 치료" },
    });

    expect(screen.getByRole("tab", { name: "PubMed" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "CINAHL" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "PubMed" }));

    expect(await screen.findByText("PubMed generated query")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "CINAHL" }));
    expect(await screen.findByText("CINAHL generated query")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "PubMed" }));

    expect(screen.getByText("PubMed generated query")).toBeInTheDocument();
    expect(screen.queryByText("CINAHL generated query")).not.toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("shows a database chip for history items", async () => {
    vi.stubGlobal("fetch", mockFetchWithQueries());

    render(<Generator settings={settings} onOpenSettings={() => undefined} />);

    fireEvent.change(screen.getByLabelText("연구 질문"), {
      target: { value: "노인 우울증 환자에서 운동 치료" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "CINAHL" }));
    await screen.findByText("CINAHL generated query");

    fireEvent.click(screen.getByRole("button", { name: "기록" }));

    expect(await screen.findByText("CINAHL")).toBeInTheDocument();
  });

  it("clears the draft question and visible results for a new question without deleting history", async () => {
    vi.stubGlobal("fetch", mockFetchWithQueries());
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Generator settings={settings} onOpenSettings={() => undefined} />);

    fireEvent.change(screen.getByLabelText("연구 질문"), {
      target: { value: "노인 우울증 환자에서 운동 치료" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "PubMed" }));
    await screen.findByText("PubMed generated query");

    fireEvent.click(screen.getByRole("button", { name: "새 질문" }));

    expect(confirm).toHaveBeenCalledWith(
      "현재 입력한 질문과 화면에 생성된 검색식이 초기화됩니다.\n생성된 검색식은 기록 탭에서 다시 확인할 수 있습니다."
    );
    expect(screen.getByLabelText("연구 질문")).toHaveValue("");
    expect(screen.queryByText("PubMed generated query")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "기록" }));

    expect(await screen.findByText("노인 우울증 환자에서 운동 치료")).toBeInTheDocument();
  });

  it("keeps the current draft when the new question confirmation is cancelled", async () => {
    vi.stubGlobal("fetch", mockFetchWithQueries());
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<Generator settings={settings} onOpenSettings={() => undefined} />);

    fireEvent.change(screen.getByLabelText("연구 질문"), {
      target: { value: "노인 우울증 환자에서 운동 치료" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "PubMed" }));
    await screen.findByText("PubMed generated query");

    fireEvent.click(screen.getByRole("button", { name: "새 질문" }));

    expect(screen.getByLabelText("연구 질문")).toHaveValue("노인 우울증 환자에서 운동 치료");
    expect(screen.getByText("PubMed generated query")).toBeInTheDocument();
  });
});
