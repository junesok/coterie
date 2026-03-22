import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_NOTIFICATIONS = 20;

// GET /api/notifications
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;

  // PENDING 상태 친구 신청 알림 ID 조회 (정리 대상 제외용)
  const pendingFriendships = await prisma.friendship.findMany({
    where: { status: "PENDING", receiverId: userId },
    select: { id: true },
  });
  const pendingFriendshipIds = pendingFriendships.map((f) => f.id);

  // PENDING 친구 신청 알림 (별도 보존 — 정리 대상 제외)
  const pendingFriendRequests = await prisma.notification.findMany({
    where: {
      userId,
      type: "FRIEND_REQUEST",
      friendshipId: { in: pendingFriendshipIds },
    },
    orderBy: { createdAt: "desc" },
  });

  // 정리 대상 알림 (PENDING 친구 신청 제외한 모든 알림)
  const pendingNotifIds = pendingFriendRequests.map((n) => n.id);
  const others = await prisma.notification.findMany({
    where: {
      userId,
      NOT: { id: { in: pendingNotifIds } },
    },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: MAX_NOTIFICATIONS + 10,
  });

  // 20개 초과분 삭제 (ACCEPTED/REJECTED 친구 신청 포함)
  if (others.length > MAX_NOTIFICATIONS) {
    const toDelete = others.slice(MAX_NOTIFICATIONS).map((n) => n.id);
    await prisma.notification.deleteMany({ where: { id: { in: toDelete } } });
  }

  const kept = others.slice(0, MAX_NOTIFICATIONS);
  const all = [...pendingFriendRequests, ...kept];

  // actor 정보 일괄 조회
  const actorIds = [...new Set(all.map((n) => n.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, username: true, name: true },
      })
    : [];
  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

  // FRIEND_REQUEST 알림에 친구 관계 상태 포함
  const friendshipIds = pendingFriendRequests
    .map((n) => n.friendshipId)
    .filter(Boolean) as string[];
  const friendships = friendshipIds.length > 0
    ? await prisma.friendship.findMany({
        where: { id: { in: friendshipIds } },
        select: { id: true, status: true },
      })
    : [];
  const friendshipMap = Object.fromEntries(friendships.map((f) => [f.id, f.status]));

  const enriched = all.map((n) => ({
    ...n,
    actor: n.actorId ? (actorMap[n.actorId] ?? null) : null,
    friendshipStatus: n.friendshipId ? (friendshipMap[n.friendshipId] ?? null) : null,
  }));

  // 미읽음 우선 정렬
  enriched.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = enriched.filter((n) => !n.isRead).length;

  return NextResponse.json({ success: true, notifications: enriched, unreadCount });
}
