import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/notifications/[id]/read — 단일 알림 읽음 처리
export async function PUT(
  _req: NextRequest,
  ctx: RouteContext<"/api/notifications/[id]/read">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
