import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — 알림 목록 (미읽은 우선)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      // actorId로 actor 유저 정보 조회 (간략 조회)
    },
  });

  // actorId 배열 추출 후 유저 정보 일괄 조회
  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, username: true, name: true },
        })
      : [];

  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const enriched = notifications.map((n) => ({
    ...n,
    actor: n.actorId ? (actorMap[n.actorId] ?? null) : null,
  }));

  return NextResponse.json({ success: true, notifications: enriched, unreadCount });
}
