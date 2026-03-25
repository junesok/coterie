import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/search?q=keyword — 사용자 검색 (정지·미인증 계정 제외)
// GET /api/users/search?q=keyword&mention=1 — @mention 자동완성용 (username prefix, 최대 6명)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const isMention = req.nextUrl.searchParams.get("mention") === "1";

    if (!q) return NextResponse.json({ success: true, users: [] });

    // @mention 자동완성 — username prefix 검색, 6명
    if (isMention) {
      const users = await prisma.user.findMany({
        where: {
          username: { startsWith: q, mode: "insensitive" },
          id: { not: session.user.id },
        },
        select: { id: true, username: true, name: true, avatarUrl: true },
        take: 6,
        orderBy: { username: "asc" },
      });
      return NextResponse.json({ success: true, users });
    }

    // 일반 사용자 검색 — username·name 포함 검색, 정지·미인증 제외
    const users = await prisma.user.findMany({
      where: {
        isSuspended: false,
        isVerified: true,
        id: { not: session.user.id },
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, username: true, avatarUrl: true },
      take: 20,
      orderBy: { username: "asc" },
    });

    // 친구 관계 조회
    const userIds = users.map((u) => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: { in: userIds } },
          { receiverId: session.user.id, senderId: { in: userIds } },
        ],
      },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });

    const usersWithStatus = users.map((u) => {
      const fs = friendships.find((f) => f.senderId === u.id || f.receiverId === u.id);
      let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none";
      let friendshipId: string | null = null;
      if (fs) {
        friendshipId = fs.id;
        if (fs.status === "ACCEPTED") friendStatus = "friends";
        else if (fs.status === "PENDING") {
          friendStatus = fs.senderId === session.user.id ? "pending_sent" : "pending_received";
        }
      }
      return { ...u, friendStatus, friendshipId };
    });

    return NextResponse.json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
