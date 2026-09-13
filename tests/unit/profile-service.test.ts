import { Prisma, QuitStatus, TriggerType } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import type {
  ProfileRepository,
  ProfileWithTriggers,
} from "@/server/repositories/profile-repository";
import { ProfileService } from "@/server/services/profile-service";

class MemoryProfileRepository implements ProfileRepository {
  profile: ProfileWithTriggers | null = null;

  async findByUserId(userId: string) {
    return this.profile?.userId === userId ? this.profile : null;
  }

  async upsert(
    userId: string,
    input: Prisma.ProfileUncheckedCreateInput,
    triggers: Prisma.ProfileTriggerUncheckedCreateInput[],
  ) {
    const now = new Date("2026-08-22T00:00:00.000Z");
    this.profile = {
      id: "profile-1",
      userId,
      cigarettesPerDay: input.cigarettesPerDay,
      smokingYears: input.smokingYears,
      minutesToFirstCigarette: input.minutesToFirstCigarette,
      quitAttempts: input.quitAttempts,
      motivation: input.motivation,
      quitStatus: input.quitStatus,
      quitDate: (input.quitDate as Date | null) ?? null,
      currency: input.currency ?? "CNY",
      cigarettePackPrice:
        input.cigarettePackPrice == null
          ? null
          : new Prisma.Decimal(input.cigarettePackPrice.toString()),
      cigarettesPerPack: input.cigarettesPerPack ?? 20,
      createdAt: this.profile?.createdAt ?? now,
      updatedAt: now,
      profileTriggers: triggers.map((trigger, index) => ({
        id: `trigger-${index}`,
        userId,
        triggerType: trigger.triggerType,
        priority: trigger.priority,
        createdAt: now,
      })),
    };
    return this.profile;
  }
}

const validInput = {
  cigarettesPerDay: 15,
  smokingYears: 8,
  minutesToFirstCigarette: 30,
  quitAttempts: 2,
  motivation: "为了家人",
  quitStatus: "reducing",
  quitDate: "2026-08-30",
  currency: "CNY",
  cigarettePackPrice: 25,
  cigarettesPerPack: 20,
  triggers: ["stress", "after_meal"],
};

describe("ProfileService CRUD", () => {
  let repository: MemoryProfileRepository;
  let service: ProfileService;

  beforeEach(() => {
    repository = new MemoryProfileRepository();
    service = new ProfileService(repository);
  });

  it("creates and reads a profile", async () => {
    const created = await service.create("user-1", validInput);
    expect(created.quitStatus).toBe("reducing");
    expect(created.triggers).toEqual(["stress", "after_meal"]);
    await expect(service.get("user-1")).resolves.toEqual(created);
  });

  it("patches fields without losing existing values", async () => {
    await service.create("user-1", validInput);
    const updated = await service.patch("user-1", {
      cigarettesPerDay: 8,
      triggers: ["habit"],
    });
    expect(updated?.cigarettesPerDay).toBe(8);
    expect(updated?.motivation).toBe("为了家人");
    expect(updated?.triggers).toEqual(["habit"]);
  });

  it("returns null when patching a missing profile", async () => {
    await expect(service.patch("missing", { cigarettesPerDay: 8 })).resolves.toBeNull();
  });

  it("rejects more than three triggers", async () => {
    await expect(
      service.create("user-1", {
        ...validInput,
        triggers: ["stress", "after_meal", "habit", "social"],
      }),
    ).rejects.toThrow();
  });
});

// Compile-time guards for enum mappings used by the in-memory repository.
void QuitStatus.REDUCING;
void TriggerType.STRESS;
