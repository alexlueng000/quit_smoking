import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai/providers/mock-provider";
import { parseInterventionOutput } from "@/lib/ai/schema";

describe("MockAIProvider", () => {
  it("returns a schema-valid high-craving intervention", async () => {
    const output = await new MockAIProvider().generateIntervention({
      userProfile: {
        cigarettesPerDay: 15,
        smokingYears: 8,
        quitAttempts: 2,
        motivation: "family",
        topTriggers: ["stress"],
      },
      currentCraving: { beforeScore: 9, trigger: "stress", context: "刚开完会" },
      recentHistory: [],
      conversation: [],
    });
    expect(parseInterventionOutput(output).strategy).toBe("urge_surfing");
  });
});
