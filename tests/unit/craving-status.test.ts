import { describe, expect, it } from "vitest";
import {
  assertCravingTransition,
  canTransitionCraving,
} from "@/lib/craving/status";

describe("craving status transitions", () => {
  it("allows the core loop transitions", () => {
    expect(canTransitionCraving("started", "intervening")).toBe(true);
    expect(canTransitionCraving("intervening", "completed")).toBe(true);
    expect(canTransitionCraving("started", "completed")).toBe(true);
  });

  it("prevents reopening terminal events", () => {
    expect(() => assertCravingTransition("completed", "intervening")).toThrow();
    expect(() => assertCravingTransition("abandoned", "completed")).toThrow();
  });
});
