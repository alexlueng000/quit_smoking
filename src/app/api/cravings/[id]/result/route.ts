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

const service = new CravingService(new PrismaCravingRepository(), createAIProvider());

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  const eventId = (await params).id;
  try {
    const body = await request.json();
    const event = await service.complete(user.id, eventId, body);
    const analyticsWrites = [
      trackEvent(db, {
        name: "craving_score_after_submitted",
        userId: user.id,
        anonymousId: user.anonymousId,
        properties: {
          craving_event_id: eventId,
          before_score: event.beforeScore,
          after_score: event.afterScore,
        },
      }),
      trackEvent(db, {
        name: "intervention_completed",
        userId: user.id,
        anonymousId: user.anonymousId,
        properties: {
          craving_event_id: eventId,
          before_score: event.beforeScore,
          after_score: event.afterScore,
          duration_seconds: event.durationSeconds,
        },
      }),
    ];
    if (body.outcome !== "unknown") {
      analyticsWrites.push(
        trackEvent(db, {
          name: body.outcome === "smoked" ? "craving_result_smoked" : "craving_result_not_smoked",
          userId: user.id,
          anonymousId: user.anonymousId,
          properties: { craving_event_id: eventId, feedback: body.feedback ?? null },
        }),
      );
    }
    await Promise.all(analyticsWrites);
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "输入内容有误" }, { status: 400 });
    if (error instanceof CravingNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof CravingConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
