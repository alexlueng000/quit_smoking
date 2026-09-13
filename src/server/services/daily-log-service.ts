import { dailyLogInputSchema, logDateSchema } from "@/lib/validation/daily-log";
import type { DailyLogRepository } from "@/server/repositories/daily-log-repository";

function parseDate(rawDate: string): Date {
  const date = logDateSchema.parse(rawDate);
  return new Date(`${date}T00:00:00.000Z`);
}

function serializeDailyLog(log: Awaited<ReturnType<DailyLogRepository["find"]>>) {
  if (!log) return null;
  return {
    logDate: log.logDate.toISOString().slice(0, 10),
    cigarettesSmoked: log.cigarettesSmoked,
    notes: log.notes,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

export class DailyLogService {
  constructor(private readonly repository: DailyLogRepository) {}

  async get(userId: string, rawDate: string) {
    return serializeDailyLog(await this.repository.find(userId, parseDate(rawDate)));
  }

  async upsert(userId: string, rawDate: string, rawInput: unknown) {
    const input = dailyLogInputSchema.parse(rawInput);
    return serializeDailyLog(await this.repository.upsert(userId, parseDate(rawDate), input));
  }
}
