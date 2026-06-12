import { describe, expect, it } from "vitest";
import { buildPubMedMessages } from "./prompt";

describe("buildPubMedMessages", () => {
  it("includes PubMed safety and JSON-only instructions", () => {
    const messages = buildPubMedMessages("성인 심부전에서 SGLT2 억제제");

    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("PubMed를 실시간으로 검색한다고 주장하지 마세요");
    expect(messages[0].content).toContain("JSON만 반환하세요");
    expect(messages[0].content).toContain("PICO");
    expect(messages[0].content).toContain("empagliflozin");
    expect(messages[1].content).toContain("성인 심부전");
  });
});
