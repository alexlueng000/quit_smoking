import { z } from "zod";
import { triggerTypes } from "@/lib/ai/strategies";

export const quitStatuses = ["not_started", "reducing", "quit"] as const;

const optionalDate = z
  .string()
  .date("请输入有效日期")
  .nullable()
  .optional();

export const profileInputSchema = z.object({
  cigarettesPerDay: z.number().int().min(0).max(200),
  smokingYears: z.number().int().min(0).max(100),
  minutesToFirstCigarette: z.number().int().min(0).max(1440),
  quitAttempts: z.number().int().min(0).max(100),
  motivation: z.string().trim().min(1).max(300),
  quitStatus: z.enum(quitStatuses),
  quitDate: optionalDate,
  currency: z.string().trim().length(3).default("CNY"),
  cigarettePackPrice: z.number().min(0).max(100000).nullable().optional(),
  cigarettesPerPack: z.number().int().min(1).max(200).default(20),
  triggers: z.array(z.enum(triggerTypes)).min(1).max(3),
});

export const profilePatchSchema = profileInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "至少提供一个需要修改的字段",
);

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfilePatch = z.infer<typeof profilePatchSchema>;
