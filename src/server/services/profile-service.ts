import {
  QuitStatus,
  TriggerType as PrismaTriggerType,
  type Prisma,
} from "@prisma/client";
import type { TriggerType } from "@/lib/ai/strategies";
import {
  profileInputSchema,
  profilePatchSchema,
  type ProfileInput,
  type ProfilePatch,
} from "@/lib/validation/profile";
import type {
  ProfileRepository,
  ProfileWithTriggers,
} from "@/server/repositories/profile-repository";

const quitStatusToDb = {
  not_started: QuitStatus.NOT_STARTED,
  reducing: QuitStatus.REDUCING,
  quit: QuitStatus.QUIT,
} as const;

const quitStatusFromDb = {
  NOT_STARTED: "not_started",
  REDUCING: "reducing",
  QUIT: "quit",
} as const;

function triggerToDb(trigger: TriggerType): PrismaTriggerType {
  return trigger.toUpperCase() as PrismaTriggerType;
}

function triggerFromDb(trigger: PrismaTriggerType): TriggerType {
  return trigger.toLowerCase() as TriggerType;
}

function toPersistence(userId: string, input: ProfileInput) {
  const profile: Prisma.ProfileUncheckedCreateInput = {
    userId,
    cigarettesPerDay: input.cigarettesPerDay,
    smokingYears: input.smokingYears,
    minutesToFirstCigarette: input.minutesToFirstCigarette,
    quitAttempts: input.quitAttempts,
    motivation: input.motivation,
    quitStatus: quitStatusToDb[input.quitStatus],
    quitDate: input.quitDate ? new Date(`${input.quitDate}T00:00:00.000Z`) : null,
    currency: input.currency,
    cigarettePackPrice: input.cigarettePackPrice ?? null,
    cigarettesPerPack: input.cigarettesPerPack,
  };
  const triggers = input.triggers.map((trigger, index) => ({
    userId,
    triggerType: triggerToDb(trigger),
    priority: index + 1,
  }));
  return { profile, triggers };
}

export function serializeProfile(profile: ProfileWithTriggers) {
  return {
    cigarettesPerDay: profile.cigarettesPerDay,
    smokingYears: profile.smokingYears,
    minutesToFirstCigarette: profile.minutesToFirstCigarette,
    quitAttempts: profile.quitAttempts,
    motivation: profile.motivation,
    quitStatus: quitStatusFromDb[profile.quitStatus],
    quitDate: profile.quitDate?.toISOString().slice(0, 10) ?? null,
    currency: profile.currency,
    cigarettePackPrice: profile.cigarettePackPrice?.toNumber() ?? null,
    cigarettesPerPack: profile.cigarettesPerPack,
    triggers: profile.profileTriggers.map((item) => triggerFromDb(item.triggerType)),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async get(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    return profile ? serializeProfile(profile) : null;
  }

  async create(userId: string, rawInput: unknown) {
    const input = profileInputSchema.parse(rawInput);
    const { profile, triggers } = toPersistence(userId, input);
    return serializeProfile(await this.repository.upsert(userId, profile, triggers));
  }

  async patch(userId: string, rawInput: unknown) {
    const patch = profilePatchSchema.parse(rawInput);
    const existing = await this.get(userId);
    if (!existing) return null;

    const merged: ProfileInput = profileInputSchema.parse({
      ...existing,
      ...(patch as ProfilePatch),
    });
    const { profile, triggers } = toPersistence(userId, merged);
    return serializeProfile(await this.repository.upsert(userId, profile, triggers));
  }
}
