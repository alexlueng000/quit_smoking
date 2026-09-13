import type { InterventionInput, InterventionOutput } from "./schema";
import type { TriggerType } from "./strategies";

export type FallbackPlan =
  | "strong_craving"
  | "stress"
  | "social"
  | "after_meal"
  | "boredom";

const plans: Record<FallbackPlan, InterventionOutput[]> = {
  strong_craving: [
    {
      strategy: "urge_surfing",
      phase: "intervention",
      message: "连接刚刚出了点问题。先不决定抽不抽，只观察这股烟瘾像浪一样起落。",
      action: { type: "urge_surfing", duration_seconds: 90 },
      should_ask_followup: true,
      followup_question: "现在最明显的感觉在嘴、手，还是胸口？",
    },
    {
      strategy: "delay_decision",
      phase: "intervention",
      message: "继续把决定推迟两分钟。把香烟和打火机放到够不到的位置。",
      action: { type: "delay", duration_seconds: 120 },
      should_ask_followup: true,
      followup_question: "现在的烟瘾比刚才强、弱，还是差不多？",
    },
  ],
  stress: [
    {
      strategy: "breathing",
      phase: "intervention",
      message: "连接刚刚出了点问题。先慢慢吸气4秒，再缓缓呼气6秒。",
      action: { type: "breathing", duration_seconds: 90 },
      should_ask_followup: true,
      followup_question: "做完后，身体哪里稍微松了一点？",
    },
    {
      strategy: "grounding",
      phase: "intervention",
      message: "现在依次找出你看到的3样东西，把注意力带回眼前。",
      action: { type: "grounding", duration_seconds: 60 },
      should_ask_followup: true,
      followup_question: "你注意到的第一样东西是什么？",
    },
  ],
  social: [
    {
      strategy: "refusal_rehearsal",
      phase: "intervention",
      message: "连接刚刚出了点问题。先练一句：谢谢，我最近不抽。",
      action: { type: "refusal_rehearsal", duration_seconds: 30 },
      should_ask_followup: true,
      followup_question: "这句话符合你的语气吗？",
    },
    {
      strategy: "delay_decision",
      phase: "intervention",
      message: "先离开递烟的位置两分钟，拿杯水，让这次决定晚一点。",
      action: { type: "delay", duration_seconds: 120 },
      should_ask_followup: true,
      followup_question: "你现在能走到哪个无烟的位置？",
    },
  ],
  after_meal: [
    {
      strategy: "behavior_replacement",
      phase: "intervention",
      message: "连接刚刚出了点问题。现在起身漱口或喝水，让饭后的固定动作换一下。",
      action: { type: "behavior_switch", duration_seconds: 60 },
      should_ask_followup: true,
      followup_question: "漱口和喝水，你现在更方便做哪个？",
    },
    {
      strategy: "delay_decision",
      phase: "intervention",
      message: "离开餐桌和常抽烟的位置，先走动两分钟再决定。",
      action: { type: "delay", duration_seconds: 120 },
      should_ask_followup: true,
      followup_question: "换个位置后，烟瘾有什么变化？",
    },
  ],
  boredom: [
    {
      strategy: "behavior_replacement",
      phase: "intervention",
      message: "连接刚刚出了点问题。给手和嘴换个动作：喝水、整理桌面或走一小圈。",
      action: { type: "behavior_switch", duration_seconds: 60 },
      should_ask_followup: true,
      followup_question: "你愿意先选哪一个动作？",
    },
    {
      strategy: "delay_decision",
      phase: "intervention",
      message: "选一件两分钟能完成的小事，做完再看烟瘾是否还在。",
      action: { type: "delay", duration_seconds: 120 },
      should_ask_followup: true,
      followup_question: "你选了哪件小事？",
    },
  ],
};

export function selectFallbackPlan(input: InterventionInput): FallbackPlan {
  if (input.currentCraving.beforeScore >= 8) return "strong_craving";
  const trigger = input.currentCraving.trigger as TriggerType;
  if (trigger === "stress" || trigger === "negative_mood") return "stress";
  if (trigger === "social" || trigger === "alcohol") return "social";
  if (trigger === "after_meal" || trigger === "habit") return "after_meal";
  return "boredom";
}

export function generateFallbackIntervention(
  input: InterventionInput,
  stepIndex: number,
): InterventionOutput {
  const plan = plans[selectFallbackPlan(input)];
  return plan[stepIndex % plan.length];
}

export function listFallbackPlans(): FallbackPlan[] {
  return Object.keys(plans) as FallbackPlan[];
}
