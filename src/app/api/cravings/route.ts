import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { trackEvent } from "@/lib/analytics";
import { createAIProvider } from "@/lib/ai/provider-factory";
import { db } from "@/lib/db";
import { PrismaCravingRepository } from "@/server/repositories/craving-repository";
import { findCurrentUser } from "@/server/services/current-user";
import { CravingService } from "@/server/services/craving-service";

const service = new CravingService(new PrismaCravingRepository(), createAIProvider());

export async function POST(request: Request) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  try {
    const event = await service.create(user.id, await request.json());
    const properties = {
      craving_event_id: event.id,
      trigger: event.triggerType,
      before_score: event.beforeScore,
    };
    await Promise.all([
      trackEvent(db, { name: "craving_created", userId: user.id, anonymousId: user.anonymousId, properties }),
      trackEvent(db, { name: "craving_score_before_submitted", userId: user.id, anonymousId: user.anonymousId, properties }),
      trackEvent(db, { name: "craving_trigger_submitted", userId: user.id, anonymousId: user.anonymousId, properties }),
    ]);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "输入内容有误", fields: error.flatten().fieldErrors }, { status: 400 });
    }
    throw error;
  }
}
