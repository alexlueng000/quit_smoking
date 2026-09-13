import { randomUUID } from "node:crypto";
import { QuitStatus } from "@prisma/client";
import { afterAll, describe, expect, it, vi } from "vitest";
import type { AIProvider } from "@/lib/ai/provider";
import { MockAIProvider } from "@/lib/ai/providers/mock-provider";
import { db } from "@/lib/db";
import { PrismaCravingRepository } from "@/server/repositories/craving-repository";
import { PrismaDailyLogRepository } from "@/server/repositories/daily-log-repository";
import { CravingService } from "@/server/services/craving-service";
import { DailyLogService } from "@/server/services/daily-log-service";
import { getAdminMetrics } from "@/server/services/metrics-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";
const createdUserIds: string[] = [];

describe.runIf(runDatabaseTests)("craving core loop with PostgreSQL", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await db.$disconnect();
  });

  it("creates, intervenes and completes an owned craving event", async () => {
    const user = await db.user.create({
      data: {
        anonymousId: randomUUID(),
        profile: {
          create: {
            cigarettesPerDay: 15,
            smokingYears: 8,
            minutesToFirstCigarette: 30,
            quitAttempts: 2,
            motivation: "为了家人",
            quitStatus: QuitStatus.REDUCING,
          },
        },
      },
    });
    createdUserIds.push(user.id);

    const service = new CravingService(
      new PrismaCravingRepository(),
      new MockAIProvider(),
    );
    const created = await service.create(user.id, {
      beforeScore: 8,
      triggerType: "stress",
      contextText: "刚开完会",
    });
    expect(created.status).toBe("started");

    const intervention = await service.intervene(user.id, created.id, {
      stepIndex: 0,
      userMessage: null,
    });
    expect(intervention.event.status).toBe("intervening");
    expect(intervention.event.steps).toHaveLength(1);
    expect(intervention.intervention.strategy).toBe("urge_surfing");

    const completed = await service.complete(user.id, created.id, {
      afterScore: 4,
      outcome: "not_smoked",
      feedback: "呼吸有帮助",
    });
    expect(completed.status).toBe("completed");
    expect(completed.afterScore).toBe(4);
    expect(completed.smoked).toBe(false);
    expect(completed.durationSeconds).not.toBeNull();

    const failingGenerate = vi.fn(async () => {
      throw new Error("provider unavailable");
    });
    const failingProvider: AIProvider = {
      name: "broken_provider",
      generateIntervention: failingGenerate,
    };
    const fallbackService = new CravingService(
      new PrismaCravingRepository(),
      failingProvider,
    );
    const fallbackEvent = await fallbackService.create(user.id, {
      beforeScore: 6,
      triggerType: "social",
      contextText: "有人递烟",
    });
    const fallback = await fallbackService.intervene(user.id, fallbackEvent.id, {
      stepIndex: 0,
      userMessage: null,
    });
    expect(fallback.delivery).toBe("fallback");
    expect(fallback.intervention.strategy).toBe("refusal_rehearsal");
    expect(failingGenerate).toHaveBeenCalledOnce();
    const storedFallback = await db.interventionStep.findFirstOrThrow({
      where: { cravingEventId: fallbackEvent.id },
    });
    expect(storedFallback.modelProvider).toBe("local_fallback");

    const safetyGenerate = vi.fn(failingGenerate);
    const safetyService = new CravingService(new PrismaCravingRepository(), {
      name: "should_not_run",
      generateIntervention: safetyGenerate,
    });
    const safetyEvent = await safetyService.create(user.id, {
      beforeScore: 7,
      triggerType: "stress",
      contextText: "我现在胸痛而且呼吸困难",
    });
    const safety = await safetyService.intervene(user.id, safetyEvent.id, {
      stepIndex: 0,
      userMessage: null,
    });
    expect(safety.delivery).toBe("safety");
    expect(safetyGenerate).not.toHaveBeenCalled();

    const dailyLogService = new DailyLogService(new PrismaDailyLogRepository());
    await dailyLogService.upsert(user.id, "2026-08-22", { cigarettesSmoked: 8 });
    await dailyLogService.upsert(user.id, "2026-08-22", {
      cigarettesSmoked: 6,
      notes: "饭后最难",
    });
    expect(await db.dailyLog.count({ where: { userId: user.id } })).toBe(1);
    expect((await dailyLogService.get(user.id, "2026-08-22"))?.cigarettesSmoked).toBe(6);

    const metrics = await getAdminMetrics(new Date("2026-08-30T00:00:00.000Z"));
    expect(metrics.totalCravingEvents).toBeGreaterThanOrEqual(3);
    expect(metrics.triggerRows.some((row) => row.trigger === "stress")).toBe(true);
    expect(metrics.interventionCompletionRate).not.toBeNull();
  });
});
