import { z } from "zod";
import { triggerTypes } from "@/lib/ai/strategies";

export const cravingCreateSchema = z.object({
  beforeScore: z.number().int().min(0).max(10),
  triggerType: z.enum(triggerTypes),
  contextText: z.string().trim().max(300).nullable().optional(),
});

export const interventionRequestSchema = z.object({
  userMessage: z.string().trim().max(300).nullable().optional(),
  stepIndex: z.number().int().min(0).max(4),
});

export const cravingResultSchema = z.object({
  afterScore: z.number().int().min(0).max(10),
  outcome: z.enum(["not_smoked", "smoked", "unknown"]),
  feedback: z.string().trim().max(300).nullable().optional(),
});

export type CravingCreateInput = z.infer<typeof cravingCreateSchema>;
export type InterventionRequest = z.infer<typeof interventionRequestSchema>;
export type CravingResultInput = z.infer<typeof cravingResultSchema>;
