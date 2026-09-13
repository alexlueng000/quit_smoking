import { z } from "zod";

export const logDateSchema = z.string().date("日期格式必须为 yyyy-mm-dd");

export const dailyLogInputSchema = z.object({
  cigarettesSmoked: z.number().int().min(0).max(200),
  notes: z.string().trim().max(500).nullable().optional(),
});

export type DailyLogInput = z.infer<typeof dailyLogInputSchema>;
