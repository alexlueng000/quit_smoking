import { beforeEach, describe, expect, it } from "vitest";
import { clearRateLimitStore, consumeRateLimit } from "@/lib/rate-limit";

describe("in-memory rate limiter", () => {
  beforeEach(clearRateLimitStore);

  it("blocks requests over the limit", () => {
    expect(consumeRateLimit("user", 2, 60_000, 0).allowed).toBe(true);
    expect(consumeRateLimit("user", 2, 60_000, 1).allowed).toBe(true);
    const blocked = consumeRateLimit("user", 2, 60_000, 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("resets after the window", () => {
    consumeRateLimit("user", 1, 1_000, 0);
    expect(consumeRateLimit("user", 1, 1_000, 1_000).allowed).toBe(true);
  });
});
