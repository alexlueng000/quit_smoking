import { describe, expect, it } from "vitest";
import {
  createAnonymousSession,
  SESSION_MAX_AGE_SECONDS,
  verifyAnonymousSession,
} from "@/lib/auth/session";

const secret = "a-secure-test-secret-with-more-than-32-characters";
const issuedAt = new Date("2026-08-22T00:00:00.000Z");

describe("anonymous session", () => {
  it("creates and verifies a signed session", () => {
    const created = createAnonymousSession(secret, issuedAt);
    expect(verifyAnonymousSession(created.value, secret, issuedAt)).toEqual(created.session);
  });

  it("rejects a modified signature", () => {
    const created = createAnonymousSession(secret, issuedAt);
    expect(verifyAnonymousSession(`${created.value}x`, secret, issuedAt)).toBeNull();
  });

  it("rejects expired sessions", () => {
    const created = createAnonymousSession(secret, issuedAt);
    const expiredAt = new Date(issuedAt.getTime() + (SESSION_MAX_AGE_SECONDS + 1) * 1000);
    expect(verifyAnonymousSession(created.value, secret, expiredAt)).toBeNull();
  });
});
