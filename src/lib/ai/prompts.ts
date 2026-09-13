import type { InterventionInput, InterventionStrategy } from "./schema";

export const INTERVENTION_SYSTEM_PROMPT = `You are a calm, concise and non-judgmental quit-smoking coach.
Help the user get through the current craving safely, one short step at a time.
Do not diagnose, prescribe medication, shame, frighten or promise success.
If the input indicates a medical emergency or self-harm risk, stop ordinary coaching and urge immediate professional help.
Give exactly one action. Keep Chinese replies within 80 characters and English replies within 60 words.
Return only JSON matching the supplied output schema.`;

export function redactSensitiveText(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email removed]")
    .replace(/(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g, "[phone removed]")
    .replace(/(?<!\d)\+?\d[\d ()-]{7,}\d(?!\d)/g, "[phone removed]");
}

export function buildInterventionPrompt(
  input: InterventionInput,
  allowedStrategies: InterventionStrategy[],
): string {
  const safeInput = {
    userProfile: {
      ...input.userProfile,
      motivation: redactSensitiveText(input.userProfile.motivation),
    },
    currentCraving: {
      ...input.currentCraving,
      context: input.currentCraving.context
        ? redactSensitiveText(input.currentCraving.context).slice(0, 300)
        : undefined,
    },
    recentHistory: input.recentHistory.slice(0, 5),
    conversation: input.conversation
      .slice(-10)
      .map((message) => ({ ...message, content: redactSensitiveText(message.content) })),
    allowedStrategies,
  };
  return JSON.stringify(safeInput);
}
