import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { createInviteCodesForUser } from "@/lib/invite";

// POST /api/admin/invite — 특정 유저에게 초대 코드 강제 발급
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { userId, count = 1 } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "userId가 필요합니다." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "유저를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const codes = await createInviteCodesForUser(userId, Math.min(count, 10));

  return NextResponse.json({ success: true, codes });
}
