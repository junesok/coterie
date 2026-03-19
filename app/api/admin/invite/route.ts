import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { createInviteCodesForUser } from "@/lib/invite";

// POST /api/admin/invite — 초대 코드 발급
// userId 없으면 관리자 본인 소유 코드 생성 (누구에게도 배포 가능한 범용 코드)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const body = await req.json().catch(() => ({}));
  const { userId, count = 1 } = body;

  // userId 지정 없으면 관리자 본인 소유
  const targetId = userId ?? session.user.id;

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "유저를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const codes = await createInviteCodesForUser(targetId, Math.min(count, 10));

  return NextResponse.json({ success: true, codes });
}

// GET /api/admin/invite — 관리자 소유 초대 코드 목록 (미사용 코드만)
export async function GET() {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const codes = await prisma.inviteCode.findMany({
    where: { ownerId: session.user.id, isUsed: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, codes });
}
