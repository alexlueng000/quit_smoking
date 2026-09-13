import { describe, expect, it } from "vitest";
import {
  generateFallbackIntervention,
  listFallbackPlans,
  selectFallbackPlan,
} from "@/lib/ai/fallbacks";
import { parseInterventionOutput, type InterventionInput } from "@/lib/ai/schema";

function input(trigger: string, score = 6): InterventionInput {
  return {
    userProfile: {
      cigarettesPerDay: 15,
      smokingYears: 8,
      quitAttempts: 2,
      motivation: "family",
      topTriggers: [trigger],
    },
    currentCraving: { beforeScore: score, trigger },
    recentHistory: [],
    conversation: [],
  };
}

describe("local intervention fallbacks", () => {
  it("contains the five required plans", () => {
    expect(listFallbackPlans()).toEqual([
      "strong_craving",
      "stress",
      "social",
      "after_meal",
      "boredom",
    ]);
  });

  it("prioritizes the strong-craving plan", () => {
    expect(selectFallbackPlan(input("social", 9))).toBe("strong_craving");
  });

  it.each([
    ["stress", "stress"],
    ["negative_mood", "stress"],
    ["social", "social"],
    ["alcohol", "social"],
    ["after_meal", "after_meal"],
    ["habit", "after_meal"],
    ["boredom", "boredom"],
    ["other", "boredom"],
  ])("maps %s to %s", (trigger, expected) => {
    expect(selectFallbackPlan(input(trigger))).toBe(expected);
  });

  it("returns schema-valid steps for every plan", () => {
    for (const [trigger, score] of [
      ["stress", 6],
      ["social", 6],
      ["after_meal", 6],
      ["boredom", 6],
      ["stress", 9],
    ] as const) {
      expect(() => parseInterventionOutput(generateFallbackIntervention(input(trigger, score), 0))).not.toThrow();
      expect(() => parseInterventionOutput(generateFallbackIntervention(input(trigger, score), 1))).not.toThrow();
    }
  });
});
