import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/friends/[id] — 수락(accept) 또는 거절(reject)
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action } = await req.json(); // "accept" | "reject"

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (friendship.receiverId !== session.user.id) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (friendship.status !== "PENDING") return NextResponse.json({ success: false, error: "Already responded" }, { status: 409 });

    if (action === "accept") {
      const updated = await prisma.friendship.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      // 신청자에게 수락 알림
      await prisma.notification.create({
        data: {
          type: "FRIEND_ACCEPT",
          userId: friendship.senderId,
          actorId: session.user.id,
          friendshipId: friendship.id,
        },
      });

      return NextResponse.json({ success: true, friendship: updated });
    }

    if (action === "reject") {
      await prisma.friendship.update({ where: { id }, data: { status: "REJECTED" } });
      // 수신자 측의 친구 신청 알림 삭제
      await prisma.notification.deleteMany({
        where: { friendshipId: id, type: "FRIEND_REQUEST" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[PUT /api/friends/[id]]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/friends/[id] — 취소(PENDING, 신청자만) 또는 삭제(ACCEPTED, 양측 가능)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const isParty = friendship.senderId === session.user.id || friendship.receiverId === session.user.id;
    if (!isParty) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    // PENDING인 경우 신청자만 취소 가능
    if (friendship.status === "PENDING" && friendship.senderId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Only sender can cancel a pending request" }, { status: 403 });
    }

    await prisma.friendship.delete({ where: { id } });

    // 관련 친구 신청 알림 삭제 (양방향)
    await prisma.notification.deleteMany({
      where: { friendshipId: id, type: "FRIEND_REQUEST" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/friends/[id]]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
