import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/friends/status?targetId=xxx
// 나와 대상 유저 간의 친구 관계 상태 반환
// { status: "none" | "pending_sent" | "pending_received" | "friends", friendshipId?: string }
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get("targetId");
    if (!targetId) return NextResponse.json({ success: false, error: "targetId required" }, { status: 400 });

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: targetId },
          { senderId: targetId, receiverId: session.user.id },
        ],
      },
    });

    if (!friendship) return NextResponse.json({ success: true, status: "none" });

    let status: string;
    if (friendship.status === "ACCEPTED") {
      status = "friends";
    } else if (friendship.status === "PENDING") {
      status = friendship.senderId === session.user.id ? "pending_sent" : "pending_received";
    } else {
      status = "none";
    }

    return NextResponse.json({ success: true, status, friendshipId: friendship.id });
  } catch (error) {
    console.error("[GET /api/friends/status]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
