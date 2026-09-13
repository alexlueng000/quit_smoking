import { describe, expect, it } from "vitest";
import { calculateRetentionRate } from "@/server/services/metrics-service";

describe("retention calculation", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");
  const users = [
    { id: "retained", createdAt: new Date("2026-08-20T00:00:00.000Z") },
    { id: "lost", createdAt: new Date("2026-08-20T00:00:00.000Z") },
    { id: "too-new", createdAt: new Date("2026-08-22T00:00:00.000Z") },
  ];

  it("excludes users without a complete observation window", () => {
    const rate = calculateRetentionRate(
      users,
      [{ userId: "retained", createdAt: new Date("2026-08-21T10:00:00.000Z") }],
      1,
      now,
    );
    expect(rate).toBe(0.5);
  });

  it("returns null when no cohort is eligible", () => {
    expect(calculateRetentionRate([users[2]], [], 7, now)).toBeNull();
  });
});
