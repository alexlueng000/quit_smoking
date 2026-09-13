import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

export type AnonymousSession = {
  anonymousId: string;
  issuedAt: number;
};

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function assertSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
}

export function createAnonymousSession(
  secret: string,
  now: Date = new Date(),
): { value: string; session: AnonymousSession } {
  assertSecret(secret);
  const session = { anonymousId: randomUUID(), issuedAt: now.getTime() };
  const payload = encode(JSON.stringify(session));
  return { value: `${payload}.${sign(payload, secret)}`, session };
}

export function verifyAnonymousSession(
  value: string,
  secret: string,
  now: Date = new Date(),
): AnonymousSession | null {
  assertSecret(secret);
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;

  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(decode(payload)) as Partial<AnonymousSession>;
    if (typeof session.anonymousId !== "string" || typeof session.issuedAt !== "number") {
      return null;
    }
    const age = now.getTime() - session.issuedAt;
    if (age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return null;
    return session as AnonymousSession;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
