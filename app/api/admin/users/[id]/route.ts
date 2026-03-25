import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// PUT /api/admin/users/[id] — 계정 정지 / 해제
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { action, reason } = await req.json();

  if (action !== "suspend" && action !== "unsuspend") {
    return NextResponse.json(
      { success: false, error: "유효하지 않은 action입니다." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, isAdmin: true } });
  if (!target) {
    return NextResponse.json({ success: false, error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.isAdmin) {
    return NextResponse.json({ success: false, error: "관리자 계정은 정지할 수 없습니다." }, { status: 403 });
  }

  const isSuspending = action === "suspend";

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        isSuspended: isSuspending,
        suspendedAt: isSuspending ? new Date() : null,
        suspendedReason: isSuspending ? (reason ?? null) : null,
      },
    }),
    prisma.moderationLog.create({
      data: {
        targetType: "USER",
        targetId: id,
        reason: reason ?? "OTHER",
        adminId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
