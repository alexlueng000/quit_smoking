import { describe, expect, it } from "vitest";
import { parseInterventionOutput } from "@/lib/ai/schema";

describe("parseInterventionOutput", () => {
  it("accepts a valid structured response", () => {
    const result = parseInterventionOutput({
      strategy: "breathing",
      phase: "intervention",
      message: "先不做决定，跟我慢慢呼吸。",
      action: { type: "breathing", duration_seconds: 90 },
      should_ask_followup: true,
      followup_question: "现在感觉有变化吗？",
    });
    expect(result.action.duration_seconds).toBe(90);
  });

  it("rejects unsafe action durations", () => {
    expect(() =>
      parseInterventionOutput({
        strategy: "breathing",
        phase: "intervention",
        message: "呼吸。",
        action: { type: "breathing", duration_seconds: 900 },
        should_ask_followup: false,
        followup_question: null,
      }),
    ).toThrow();
  });

  it("rejects Chinese replies longer than 80 characters", () => {
    expect(() =>
      parseInterventionOutput({
        strategy: "breathing",
        phase: "intervention",
        message: "这".repeat(81),
        action: { type: "breathing", duration_seconds: 90 },
        should_ask_followup: false,
        followup_question: null,
      }),
    ).toThrow("回复超过长度限制");
  });

  it("requires durations for timed actions", () => {
    expect(() =>
      parseInterventionOutput({
        strategy: "breathing",
        phase: "intervention",
        message: "慢慢呼吸。",
        action: { type: "breathing" },
        should_ask_followup: false,
        followup_question: null,
      }),
    ).toThrow("计时或行动步骤必须提供持续时间");
  });
});
