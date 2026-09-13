import { describe, expect, it } from "vitest";
import {
  calculateDailySmokingCost,
  calculateEstimatedSavings,
} from "@/lib/calculations/savings";

describe("savings calculations", () => {
  it("calculates the daily cost from referenced inputs", () => {
    expect(calculateDailySmokingCost(10, 30, 20)).toBe(15);
  });

  it("calculates savings from elapsed complete days", () => {
    expect(
      calculateEstimatedSavings(
        new Date("2026-08-20T00:00:00.000Z"),
        new Date("2026-08-22T12:00:00.000Z"),
        10,
        30,
        20,
      ),
    ).toBe(30);
  });

  it("returns zero when price is unavailable", () => {
    expect(calculateDailySmokingCost(10, null, 20)).toBe(0);
  });
});
