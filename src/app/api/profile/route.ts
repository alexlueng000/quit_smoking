import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { PrismaProfileRepository } from "@/server/repositories/profile-repository";
import { findCurrentUser, requireCurrentUser } from "@/server/services/current-user";
import { ProfileService } from "@/server/services/profile-service";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const service = new ProfileService(new PrismaProfileRepository());

function validationError(error: ZodError) {
  return NextResponse.json(
    { error: "输入内容有误", fields: error.flatten().fieldErrors },
    { status: 400 },
  );
}

export async function GET() {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: await service.get(user.id) });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });

  try {
    const profile = await service.create(user.id, await request.json());
    await trackEvent(db, {
      name: "onboarding_completed",
      userId: user.id,
      anonymousId: user.anonymousId,
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    throw error;
  }
}

export async function PATCH(request: Request) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });

  try {
    const profile = await service.patch(user.id, await request.json());
    if (!profile) return NextResponse.json({ error: "档案不存在" }, { status: 404 });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    throw error;
  }
}

export async function DELETE() {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  await db.user.delete({ where: { id: user.id } });
  const response = NextResponse.json({ deleted: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
