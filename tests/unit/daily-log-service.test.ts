import type { DailyLog } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { DailyLogInput } from "@/lib/validation/daily-log";
import type { DailyLogRepository } from "@/server/repositories/daily-log-repository";
import { DailyLogService } from "@/server/services/daily-log-service";

class MemoryDailyLogRepository implements DailyLogRepository {
  private logs = new Map<string, DailyLog>();

  private key(userId: string, date: Date) {
    return `${userId}:${date.toISOString().slice(0, 10)}`;
  }

  async find(userId: string, logDate: Date) {
    return this.logs.get(this.key(userId, logDate)) ?? null;
  }

  async upsert(userId: string, logDate: Date, input: DailyLogInput) {
    const key = this.key(userId, logDate);
    const existing = this.logs.get(key);
    const now = new Date("2026-08-22T00:00:00.000Z");
    const log: DailyLog = {
      id: existing?.id ?? "log-1",
      userId,
      logDate,
      cigarettesSmoked: input.cigarettesSmoked,
      notes: input.notes || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.logs.set(key, log);
    return log;
  }
}

describe("DailyLogService", () => {
  it("creates and updates one record per date", async () => {
    const service = new DailyLogService(new MemoryDailyLogRepository());
    await service.upsert("user-1", "2026-08-22", { cigarettesSmoked: 8 });
    const updated = await service.upsert("user-1", "2026-08-22", {
      cigarettesSmoked: 6,
      notes: "饭后最难",
    });
    expect(updated?.cigarettesSmoked).toBe(6);
    expect(updated?.notes).toBe("饭后最难");
    await expect(service.get("user-1", "2026-08-22")).resolves.toEqual(updated);
  });

  it("rejects invalid dates and counts", async () => {
    const service = new DailyLogService(new MemoryDailyLogRepository());
    await expect(service.get("user-1", "22-08-2026")).rejects.toThrow();
    await expect(
      service.upsert("user-1", "2026-08-22", { cigarettesSmoked: -1 }),
    ).rejects.toThrow();
  });
});
