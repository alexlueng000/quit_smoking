import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyAnonymousSession } from "@/lib/auth/session";
import { PrismaUserRepository, type UserRepository } from "@/server/repositories/user-repository";

export async function getAnonymousId(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");

  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  return verifyAnonymousSession(value, secret)?.anonymousId ?? null;
}

export async function requireCurrentUser(
  repository: UserRepository = new PrismaUserRepository(),
) {
  const anonymousId = await getAnonymousId();
  if (!anonymousId) return null;
  return repository.findOrCreateAnonymous(anonymousId);
}

export async function findCurrentUser(
  repository: UserRepository = new PrismaUserRepository(),
) {
  const anonymousId = await getAnonymousId();
  if (!anonymousId) return null;
  return repository.findAnonymous(anonymousId);
}
