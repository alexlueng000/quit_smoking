import {
  CravingStatus as DbCravingStatus,
  InterventionStrategy as DbInterventionStrategy,
  TriggerType as DbTriggerType,
  type CravingEvent,
  type InterventionStep,
} from "@prisma/client";
import type { InterventionOutput, InterventionStrategy } from "@/lib/ai/schema";
import type { TriggerType } from "@/lib/ai/strategies";
import { db } from "@/lib/db";
import type { CravingCreateInput, CravingResultInput } from "@/lib/validation/craving";

export type CravingRecord = CravingEvent & { interventionSteps: InterventionStep[] };

export type InterventionContextRecord = {
  event: CravingRecord;
  profile: {
    cigarettesPerDay: number;
    smokingYears: number;
    quitAttempts: number;
    motivation: string;
    topTriggers: TriggerType[];
  };
  recentEvents: Array<{
    trigger: TriggerType;
    before: number;
    after: number | null;
    strategy: InterventionStrategy | null;
    smoked: boolean | null;
  }>;
};

export interface CravingRepository {
  create(userId: string, input: CravingCreateInput): Promise<CravingRecord>;
  findOwned(eventId: string, userId: string): Promise<CravingRecord | null>;
  getInterventionContext(eventId: string, userId: string): Promise<InterventionContextRecord | null>;
  addInterventionStep(
    eventId: string,
    strategy: InterventionStrategy,
    stepIndex: number,
    output: InterventionOutput,
    userResponse: string | null,
    model: { provider: string; name: string | null; latencyMs: number },
  ): Promise<CravingRecord>;
  complete(
    eventId: string,
    input: CravingResultInput,
    durationSeconds: number,
  ): Promise<CravingRecord>;
}

function triggerToDb(trigger: TriggerType): DbTriggerType {
  return trigger.toUpperCase() as DbTriggerType;
}

function triggerFromDb(trigger: DbTriggerType): TriggerType {
  return trigger.toLowerCase() as TriggerType;
}

function strategyToDb(strategy: InterventionStrategy): DbInterventionStrategy {
  return strategy.toUpperCase() as DbInterventionStrategy;
}

function strategyFromDb(strategy: DbInterventionStrategy | null): InterventionStrategy | null {
  return strategy ? (strategy.toLowerCase() as InterventionStrategy) : null;
}

const withSteps = { interventionSteps: { orderBy: { stepIndex: "asc" as const } } };

export class PrismaCravingRepository implements CravingRepository {
  async create(userId: string, input: CravingCreateInput): Promise<CravingRecord> {
    return db.cravingEvent.create({
      data: {
        userId,
        beforeScore: input.beforeScore,
        triggerType: triggerToDb(input.triggerType),
        contextText: input.contextText || null,
      },
      include: withSteps,
    });
  }

  async findOwned(eventId: string, userId: string): Promise<CravingRecord | null> {
    return db.cravingEvent.findFirst({
      where: { id: eventId, userId },
      include: withSteps,
    });
  }

  async getInterventionContext(
    eventId: string,
    userId: string,
  ): Promise<InterventionContextRecord | null> {
    const [event, user, recentEvents] = await Promise.all([
      this.findOwned(eventId, userId),
      db.user.findUnique({
        where: { id: userId },
        include: { profile: true, profileTriggers: { orderBy: { priority: "asc" } } },
      }),
      db.cravingEvent.findMany({
        where: { userId, status: DbCravingStatus.COMPLETED, id: { not: eventId } },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
    ]);
    if (!event || !user?.profile) return null;

    return {
      event,
      profile: {
        cigarettesPerDay: user.profile.cigarettesPerDay,
        smokingYears: user.profile.smokingYears,
        quitAttempts: user.profile.quitAttempts,
        motivation: user.profile.motivation,
        topTriggers: user.profileTriggers.map((item) => triggerFromDb(item.triggerType)),
      },
      recentEvents: recentEvents.map((item) => ({
        trigger: triggerFromDb(item.triggerType),
        before: item.beforeScore,
        after: item.afterScore,
        strategy: strategyFromDb(item.primaryStrategy),
        smoked: item.smoked,
      })),
    };
  }

  async addInterventionStep(
    eventId: string,
    strategy: InterventionStrategy,
    stepIndex: number,
    output: InterventionOutput,
    userResponse: string | null,
    model: { provider: string; name: string | null; latencyMs: number },
  ): Promise<CravingRecord> {
    return db.$transaction(async (transaction) => {
      await transaction.cravingEvent.update({
        where: { id: eventId },
        data: {
          status: DbCravingStatus.INTERVENING,
          primaryStrategy: stepIndex === 0 ? strategyToDb(strategy) : undefined,
        },
      });
      await transaction.interventionStep.create({
        data: {
          cravingEventId: eventId,
          stepIndex,
          strategy: strategyToDb(output.strategy),
          actionType: output.action.type,
          aiMessage: output.message,
          userResponse,
          modelProvider: model.provider,
          modelName: model.name,
          latencyMs: model.latencyMs,
        },
      });
      return transaction.cravingEvent.findUniqueOrThrow({
        where: { id: eventId },
        include: withSteps,
      });
    });
  }

  async complete(
    eventId: string,
    input: CravingResultInput,
    durationSeconds: number,
  ): Promise<CravingRecord> {
    const smoked = input.outcome === "unknown" ? null : input.outcome === "smoked";
    return db.cravingEvent.update({
      where: { id: eventId },
      data: {
        afterScore: input.afterScore,
        smoked,
        status: DbCravingStatus.COMPLETED,
        completedAt: new Date(),
        durationSeconds,
      },
      include: withSteps,
    });
  }
}
