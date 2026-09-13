import { describe, expect, it } from "vitest";
import {
  createEdgeAnonymousSession,
  verifyEdgeAnonymousSession,
} from "@/lib/auth/edge-session";
import { verifyAnonymousSession } from "@/lib/auth/session";

describe("edge anonymous session", () => {
  it("creates a token accepted by the Node verifier", async () => {
    const secret = "a-secure-test-secret-with-more-than-32-characters";
    const now = new Date("2026-08-22T00:00:00.000Z");
    const value = await createEdgeAnonymousSession(secret, now);
    expect(verifyAnonymousSession(value, secret, now)?.issuedAt).toBe(now.getTime());
    await expect(verifyEdgeAnonymousSession(value, secret, now)).resolves.toBe(true);
    await expect(verifyEdgeAnonymousSession(`${value}x`, secret, now)).resolves.toBe(false);
  });
});
