import type { InterventionStrategy } from "./schema";

export const triggerTypes = [
  "stress",
  "after_meal",
  "alcohol",
  "social",
  "boredom",
  "habit",
  "negative_mood",
  "other",
] as const;

export type TriggerType = (typeof triggerTypes)[number];

const strategyByTrigger: Record<TriggerType, InterventionStrategy[]> = {
  stress: ["breathing", "grounding"],
  negative_mood: ["breathing", "grounding"],
  after_meal: ["behavior_replacement", "delay_decision"],
  habit: ["behavior_replacement", "delay_decision"],
  social: ["refusal_rehearsal"],
  alcohol: ["delay_decision"],
  boredom: ["behavior_replacement"],
  other: ["delay_decision"],
};

export function selectStrategies(
  trigger: TriggerType,
  beforeScore: number,
): InterventionStrategy[] {
  if (!Number.isInteger(beforeScore) || beforeScore < 0 || beforeScore > 10) {
    throw new RangeError("beforeScore must be an integer from 0 to 10");
  }

  if (beforeScore >= 8) {
    return ["urge_surfing", "delay_decision"];
  }

  return [...strategyByTrigger[trigger]];
}
