import type { User } from "@prisma/client";
import { db } from "@/lib/db";

export interface UserRepository {
  findAnonymous(anonymousId: string): Promise<User | null>;
  findOrCreateAnonymous(anonymousId: string): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  async findAnonymous(anonymousId: string): Promise<User | null> {
    return db.user.findUnique({ where: { anonymousId } });
  }

  async findOrCreateAnonymous(anonymousId: string): Promise<User> {
    return db.user.upsert({
      where: { anonymousId },
      update: {},
      create: { anonymousId },
    });
  }
}
