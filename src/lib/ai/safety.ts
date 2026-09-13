import type { InterventionOutput } from "./schema";

const medicalPatterns = [
  /胸痛|呼吸困难|喘不过气|晕厥|意识不清|咳血/iu,
  /chest pain|trouble breathing|can(?:not|'t) breathe|fainting|coughing blood/iu,
];
const selfHarmPatterns = [
  /自杀|不想活|伤害自己/iu,
  /suicide|kill myself|hurt myself/iu,
];

export type SafetyEscalation = "medical_emergency" | "self_harm";

export function detectSafetyEscalation(text: string): SafetyEscalation | null {
  if (selfHarmPatterns.some((pattern) => pattern.test(text))) return "self_harm";
  if (medicalPatterns.some((pattern) => pattern.test(text))) return "medical_emergency";
  return null;
}

export function createSafetyIntervention(kind: SafetyEscalation): InterventionOutput {
  return {
    strategy: "grounding",
    phase: "intervention",
    message:
      kind === "self_harm"
        ? "这听起来需要立即支持。请联系当地急救或危机热线，并让可信任的人现在陪着你。"
        : "请停止普通戒烟练习，立即联系当地急救或尽快就医；不要独自等待症状过去。",
    action: { type: "conversation" },
    should_ask_followup: false,
    followup_question: null,
  };
}
