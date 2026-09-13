import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { PrismaDailyLogRepository } from "@/server/repositories/daily-log-repository";
import { findCurrentUser } from "@/server/services/current-user";
import { DailyLogService } from "@/server/services/daily-log-service";

const service = new DailyLogService(new PrismaDailyLogRepository());

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  try {
    return NextResponse.json({ log: await service.get(user.id, (await params).date) });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "日期格式有误" }, { status: 400 });
    throw error;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  try {
    const date = (await params).date;
    const existing = await service.get(user.id, date);
    const log = await service.upsert(user.id, date, await request.json());
    if (!existing) {
      await trackEvent(db, {
        name: "daily_checkin_completed",
        userId: user.id,
        anonymousId: user.anonymousId,
        properties: { log_date: date, cigarettes_smoked: log?.cigarettesSmoked ?? 0 },
      });
    }
    return NextResponse.json({ log });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "输入内容有误", fields: error.flatten().fieldErrors }, { status: 400 });
    throw error;
  }
}
