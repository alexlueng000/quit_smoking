import type { DailyLog } from "@prisma/client";
import { db } from "@/lib/db";
import type { DailyLogInput } from "@/lib/validation/daily-log";

export interface DailyLogRepository {
  find(userId: string, logDate: Date): Promise<DailyLog | null>;
  upsert(userId: string, logDate: Date, input: DailyLogInput): Promise<DailyLog>;
}

export class PrismaDailyLogRepository implements DailyLogRepository {
  async find(userId: string, logDate: Date): Promise<DailyLog | null> {
    return db.dailyLog.findUnique({ where: { userId_logDate: { userId, logDate } } });
  }

  async upsert(userId: string, logDate: Date, input: DailyLogInput): Promise<DailyLog> {
    return db.dailyLog.upsert({
      where: { userId_logDate: { userId, logDate } },
      update: {
        cigarettesSmoked: input.cigarettesSmoked,
        notes: input.notes || null,
      },
      create: {
        userId,
        logDate,
        cigarettesSmoked: input.cigarettesSmoked,
        notes: input.notes || null,
      },
    });
  }
}
