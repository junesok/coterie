import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/invite/my-codes — 내 초대 코드 3개 + 사용 현황
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const codes = await prisma.inviteCode.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: {
        usedBy: { select: { name: true, username: true } },
      },
    });

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error("[GET /api/invite/my-codes]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
