import { NextResponse } from "next/server";
import { createAIProvider } from "@/lib/ai/provider-factory";
import { PrismaCravingRepository } from "@/server/repositories/craving-repository";
import { findCurrentUser } from "@/server/services/current-user";
import { CravingService } from "@/server/services/craving-service";

const service = new CravingService(new PrismaCravingRepository(), createAIProvider());

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await findCurrentUser();
  if (!user) return NextResponse.json({ error: "未找到会话" }, { status: 401 });
  const event = await service.get(user.id, (await params).id);
  if (!event) return NextResponse.json({ error: "烟瘾记录不存在" }, { status: 404 });
  return NextResponse.json({ event });
}
