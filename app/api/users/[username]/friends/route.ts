import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[username]/friends — 해당 유저의 친구 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.senderId === user.id ? f.receiver : f.sender
    );

    return NextResponse.json({ success: true, friends });
  } catch (error) {
    console.error("[GET /api/users/[username]/friends]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
