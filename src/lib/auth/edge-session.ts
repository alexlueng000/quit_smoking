import { SESSION_MAX_AGE_SECONDS } from "./constants";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function encode(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importHmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function createEdgeAnonymousSession(
  secret: string,
  now: Date = new Date(),
): Promise<string> {
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  const session = { anonymousId: crypto.randomUUID(), issuedAt: now.getTime() };
  const payload = encode(JSON.stringify(session));
  const key = await importHmacKey(secret, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyEdgeAnonymousSession(
  value: string,
  secret: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (secret.length < 32) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return false;

  try {
    const key = await importHmacKey(secret, "verify");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return false;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      anonymousId?: unknown;
      issuedAt?: unknown;
    };
    if (typeof session.anonymousId !== "string" || typeof session.issuedAt !== "number") {
      return false;
    }
    const age = now.getTime() - session.issuedAt;
    return age >= 0 && age <= SESSION_MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export { SESSION_MAX_AGE_SECONDS };
