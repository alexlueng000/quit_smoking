import { describe, expect, it } from "vitest";
import { buildInterventionPrompt, redactSensitiveText } from "@/lib/ai/prompts";
import type { InterventionInput } from "@/lib/ai/schema";

describe("intervention prompt builder", () => {
  it("redacts phone numbers and emails", () => {
    expect(redactSensitiveText("联系 13812345678 或 test@example.com")).toBe(
      "联系 [phone removed] 或 [email removed]",
    );
  });

  it("limits history and conversation context", () => {
    const input: InterventionInput = {
      userProfile: {
        cigarettesPerDay: 10,
        smokingYears: 5,
        quitAttempts: 1,
        motivation: "联系 me@example.com",
        topTriggers: ["stress"],
      },
      currentCraving: {
        beforeScore: 7,
        trigger: "stress",
        context: `电话13812345678 ${"事".repeat(400)}`,
      },
      recentHistory: Array.from({ length: 8 }, () => ({
        trigger: "stress",
        before: 7,
        after: 4,
        strategy: "breathing" as const,
        smoked: false,
      })),
      conversation: Array.from({ length: 15 }, (_, index) => ({
        role: index % 2 ? "assistant" as const : "user" as const,
        content: `消息 ${index}`,
      })),
    };
    const prompt = JSON.parse(buildInterventionPrompt(input, ["breathing"])) as {
      userProfile: { motivation: string };
      currentCraving: { context: string };
      recentHistory: unknown[];
      conversation: unknown[];
    };
    expect(prompt.userProfile.motivation).not.toContain("me@example.com");
    expect(prompt.currentCraving.context).not.toContain("13812345678");
    expect(prompt.currentCraving.context.length).toBeLessThanOrEqual(300);
    expect(prompt.recentHistory).toHaveLength(5);
    expect(prompt.conversation).toHaveLength(10);
  });
});
