import type { Prisma, Profile, ProfileTrigger } from "@prisma/client";
import { db } from "@/lib/db";

export type ProfileWithTriggers = Profile & { profileTriggers: ProfileTrigger[] };

export interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileWithTriggers | null>;
  upsert(
    userId: string,
    profile: Prisma.ProfileUncheckedCreateInput,
    triggerTypes: Prisma.ProfileTriggerUncheckedCreateInput[],
  ): Promise<ProfileWithTriggers>;
}

export class PrismaProfileRepository implements ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileWithTriggers | null> {
    const profile = await db.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    const profileTriggers = await db.profileTrigger.findMany({
      where: { userId },
      orderBy: { priority: "asc" },
    });
    return { ...profile, profileTriggers };
  }

  async upsert(
    userId: string,
    profile: Prisma.ProfileUncheckedCreateInput,
    triggerTypes: Prisma.ProfileTriggerUncheckedCreateInput[],
  ): Promise<ProfileWithTriggers> {
    return db.$transaction(async (transaction) => {
      const saved = await transaction.profile.upsert({
        where: { userId },
        update: profile,
        create: profile,
      });
      await transaction.profileTrigger.deleteMany({ where: { userId } });
      await transaction.profileTrigger.createMany({ data: triggerTypes });
      const savedTriggers = await transaction.profileTrigger.findMany({
        where: { userId },
        orderBy: { priority: "asc" },
      });
      return { ...saved, profileTriggers: savedTriggers };
    });
  }
}
