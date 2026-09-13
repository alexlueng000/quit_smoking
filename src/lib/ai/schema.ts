import { z } from "zod";

export const interventionStrategySchema = z.enum([
  "breathing",
  "delay_decision",
  "urge_surfing",
  "behavior_replacement",
  "grounding",
  "refusal_rehearsal",
  "cognitive_reframe",
  "relapse_review",
]);

export const interventionActionSchema = z.object({
  type: z.enum([
    "conversation",
    "breathing",
    "delay",
    "grounding",
    "behavior_switch",
    "refusal_rehearsal",
    "urge_surfing",
  ]),
  duration_seconds: z.number().int().min(10).max(300).optional(),
});

function withinReplyLimit(message: string): boolean {
  if (/\p{Script=Han}/u.test(message)) return Array.from(message).length <= 80;
  return message.trim().split(/\s+/).filter(Boolean).length <= 60;
}

export const interventionOutputSchema = z
  .object({
    strategy: interventionStrategySchema,
    phase: z.literal("intervention"),
    message: z.string().trim().min(1).max(400).refine(withinReplyLimit, "回复超过长度限制"),
    action: interventionActionSchema,
    should_ask_followup: z.boolean(),
    followup_question: z.string().trim().max(160).nullable(),
  })
  .superRefine((value, context) => {
    if (value.action.type !== "conversation" && value.action.duration_seconds === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action", "duration_seconds"],
        message: "计时或行动步骤必须提供持续时间",
      });
    }
    if (value.should_ask_followup && !value.followup_question) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["followup_question"],
        message: "需要追问时必须提供问题",
      });
    }
  });

export type InterventionStrategy = z.infer<typeof interventionStrategySchema>;
export type InterventionOutput = z.infer<typeof interventionOutputSchema>;

export type InterventionInput = {
  userProfile: {
    cigarettesPerDay: number;
    smokingYears: number;
    quitAttempts: number;
    motivation: string;
    topTriggers: string[];
  };
  currentCraving: {
    beforeScore: number;
    trigger: string;
    context?: string;
  };
  recentHistory: Array<{
    trigger: string;
    before: number;
    after: number | null;
    strategy: InterventionStrategy | null;
    smoked: boolean | null;
  }>;
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
};

export function parseInterventionOutput(value: unknown): InterventionOutput {
  return interventionOutputSchema.parse(value);
}
