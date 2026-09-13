import type { AIProvider } from "@/lib/ai/provider";
import { generateFallbackIntervention } from "@/lib/ai/fallbacks";
import {
  parseInterventionOutput,
  type InterventionInput,
  type InterventionOutput,
  type InterventionStrategy,
} from "@/lib/ai/schema";
import { createSafetyIntervention, detectSafetyEscalation } from "@/lib/ai/safety";
import type { TriggerType } from "@/lib/ai/strategies";
import { assertCravingTransition, type CravingStatus } from "@/lib/craving/status";
import { logger } from "@/lib/logger";
import {
  cravingCreateSchema,
  cravingResultSchema,
  interventionRequestSchema,
} from "@/lib/validation/craving";
import type {
  CravingRecord,
  CravingRepository,
} from "@/server/repositories/craving-repository";

const statusFromDb = {
  STARTED: "started",
  INTERVENING: "intervening",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;

export class CravingNotFoundError extends Error {}
export class CravingConflictError extends Error {}

export function serializeCraving(event: CravingRecord) {
  return {
    id: event.id,
    triggerType: event.triggerType.toLowerCase() as TriggerType,
    contextText: event.contextText,
    beforeScore: event.beforeScore,
    afterScore: event.afterScore,
    primaryStrategy: event.primaryStrategy?.toLowerCase() as InterventionStrategy | undefined,
    smoked: event.smoked,
    status: statusFromDb[event.status],
    startedAt: event.startedAt.toISOString(),
    completedAt: event.completedAt?.toISOString() ?? null,
    durationSeconds: event.durationSeconds,
    steps: event.interventionSteps.map((step) => ({
      stepIndex: step.stepIndex,
      strategy: step.strategy.toLowerCase() as InterventionStrategy,
      actionType: step.actionType,
      message: step.aiMessage,
      userResponse: step.userResponse,
      createdAt: step.createdAt.toISOString(),
    })),
  };
}

export class CravingService {
  constructor(
    private readonly repository: CravingRepository,
    private readonly provider: AIProvider,
  ) {}

  async create(userId: string, rawInput: unknown) {
    const input = cravingCreateSchema.parse(rawInput);
    return serializeCraving(await this.repository.create(userId, input));
  }

  async get(userId: string, eventId: string) {
    const event = await this.repository.findOwned(eventId, userId);
    return event ? serializeCraving(event) : null;
  }

  async intervene(userId: string, eventId: string, rawInput: unknown) {
    const request = interventionRequestSchema.parse(rawInput);
    const context = await this.repository.getInterventionContext(eventId, userId);
    if (!context) throw new CravingNotFoundError("烟瘾记录不存在");

    const status = statusFromDb[context.event.status] as CravingStatus;
    if (status === "completed" || status === "abandoned") {
      throw new CravingConflictError("本次干预已经结束");
    }
    if (request.stepIndex !== context.event.interventionSteps.length) {
      throw new CravingConflictError("干预步骤顺序不正确，请刷新后重试");
    }
    if (context.event.interventionSteps.length >= 5) {
      throw new CravingConflictError("本次干预已达到最多 5 个步骤");
    }

    const conversation: InterventionInput["conversation"] = [];
    for (const step of context.event.interventionSteps) {
      if (step.userResponse) conversation.push({ role: "user", content: step.userResponse });
      conversation.push({ role: "assistant", content: step.aiMessage });
    }
    if (request.userMessage) conversation.push({ role: "user", content: request.userMessage });

    const input: InterventionInput = {
      userProfile: context.profile,
      currentCraving: {
        beforeScore: context.event.beforeScore,
        trigger: context.event.triggerType.toLowerCase(),
        context: context.event.contextText ?? undefined,
      },
      recentHistory: context.recentEvents,
      conversation,
    };
    const startedAt = performance.now();
    const safetyEscalation = detectSafetyEscalation(
      `${input.currentCraving.context ?? ""} ${request.userMessage ?? ""}`,
    );
    let delivery: "ai" | "fallback" | "safety" = "ai";
    let providerName = this.provider.name;
    let modelName = process.env.AI_MODEL ?? null;
    let output: InterventionOutput;
    if (safetyEscalation) {
      delivery = "safety";
      providerName = "safety_rules";
      modelName = null;
      output = createSafetyIntervention(safetyEscalation);
    } else {
      try {
        output = await this.provider.generateIntervention(input);
      } catch (error) {
        delivery = "fallback";
        providerName = "local_fallback";
        modelName = null;
        output = generateFallbackIntervention(input, request.stepIndex);
        logger.warn("ai_provider_fallback", {
          provider: this.provider.name,
          cravingEventId: eventId,
          stepIndex: request.stepIndex,
          error: error instanceof Error ? error.name : "unknown",
        });
      }
    }
    output = parseInterventionOutput(output);
    const latencyMs = Math.round(performance.now() - startedAt);
    const saved = await this.repository.addInterventionStep(
      eventId,
      output.strategy,
      request.stepIndex,
      output,
      request.userMessage ?? null,
      { provider: providerName, name: modelName, latencyMs },
    );
    return { event: serializeCraving(saved), intervention: output, delivery };
  }

  async complete(userId: string, eventId: string, rawInput: unknown) {
    const input = cravingResultSchema.parse(rawInput);
    const event = await this.repository.findOwned(eventId, userId);
    if (!event) throw new CravingNotFoundError("烟瘾记录不存在");
    const status = statusFromDb[event.status] as CravingStatus;
    try {
      assertCravingTransition(status, "completed");
    } catch {
      throw new CravingConflictError("本次干预已经结束");
    }
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - event.startedAt.getTime()) / 1000),
    );
    return serializeCraving(
      await this.repository.complete(eventId, input, durationSeconds),
    );
  }
}
