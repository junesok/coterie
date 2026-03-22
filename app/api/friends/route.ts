import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/friends — 친구 신청
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();
    if (!receiverId) return NextResponse.json({ success: false, error: "receiverId required" }, { status: 400 });
    if (receiverId === session.user.id) return NextResponse.json({ success: false, error: "Cannot add yourself" }, { status: 400 });

    // 이미 관계 존재 여부 확인 (양방향)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId },
          { senderId: receiverId, receiverId: session.user.id },
        ],
      },
    });
    if (existing) return NextResponse.json({ success: false, error: "Already exists" }, { status: 409 });

    const friendship = await prisma.friendship.create({
      data: { senderId: session.user.id, receiverId },
    });

    // 수신자에게 FRIEND_REQUEST 알림
    await prisma.notification.create({
      data: {
        type: "FRIEND_REQUEST",
        userId: receiverId,
        actorId: session.user.id,
        friendshipId: friendship.id,
      },
    });

    return NextResponse.json({ success: true, friendship }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/friends]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET /api/friends — 내 친구 목록 (ACCEPTED)
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.senderId === session.user.id ? f.receiver : f.sender
    );

    return NextResponse.json({ success: true, friends });
  } catch (error) {
    console.error("[GET /api/friends]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
