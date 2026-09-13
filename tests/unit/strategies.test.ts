import { describe, expect, it } from "vitest";
import { selectStrategies } from "@/lib/ai/strategies";

describe("selectStrategies", () => {
  it("uses grounding strategies for stress", () => {
    expect(selectStrategies("stress", 6)).toEqual(["breathing", "grounding"]);
  });

  it("prioritizes urge surfing for strong cravings", () => {
    expect(selectStrategies("social", 8)).toEqual(["urge_surfing", "delay_decision"]);
  });

  it("rejects invalid scores", () => {
    expect(() => selectStrategies("habit", 11)).toThrow(RangeError);
  });
});
