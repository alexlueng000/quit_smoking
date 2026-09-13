import { describe, expect, it } from "vitest";
import { createAIProvider } from "@/lib/ai/provider-factory";

describe("createAIProvider", () => {
  it("uses the mock provider by default", () => {
    expect(createAIProvider({}).name).toBe("mock");
  });

  it("returns a failing adapter instead of crashing on incomplete configuration", async () => {
    const provider = createAIProvider({ AI_PROVIDER: "deepseek" });
    expect(provider.name).toBe("deepseek");
    await expect(
      provider.generateIntervention({
        userProfile: {
          cigarettesPerDay: 10,
          smokingYears: 5,
          quitAttempts: 1,
          motivation: "health",
          topTriggers: ["stress"],
        },
        currentCraving: { beforeScore: 7, trigger: "stress" },
        recentHistory: [],
        conversation: [],
      }),
    ).rejects.toThrow("configuration is incomplete");
  });
});
