import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createAIProvider } from "@/lib/ai/provider-factory";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { PrismaCravingRepository } from "@/server/repositories/craving-repository";
import { findCurrentUser } from "@/server/services/current-user";
import {
  CravingConflictError,
  CravingNotFoundError,
  CravingService,
} from "@/server/services/craving-service";

const provider = createAIProvider();
const service = new CravingService(new PrismaCravingRepository(), provider);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  const eventId = (await params).id;
  try {
    const result = await service.intervene(user.id, eventId, await request.json());
    await trackEvent(db, {
      name: result.event.steps.length === 1 ? "intervention_started" : "intervention_step_completed",
      userId: user.id,
      anonymousId: user.anonymousId,
      properties: {
        craving_event_id: eventId,
        strategy: result.intervention.strategy,
        step_index: result.event.steps.length - 1,
        delivery: result.delivery,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "输入内容有误" }, { status: 400 });
    if (error instanceof CravingNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof CravingConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
