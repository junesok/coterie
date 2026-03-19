import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ModerationReason } from "@/app/generated/prisma/client";

// DELETE /api/admin/comments/[id] — 관리자 댓글 삭제 (사유 포함)
export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/comments/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { reason } = await req.json();

  if (!reason || !Object.values(ModerationReason).includes(reason)) {
    return NextResponse.json(
      { success: false, error: "유효한 삭제 사유를 선택해 주세요." },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { _count: { select: { replies: true } } },
  });

  if (!comment || comment.isDeleted) {
    return NextResponse.json(
      { success: false, error: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 답글 있으면 소프트 삭제, 없으면 하드 삭제
  const deleteOp =
    comment._count.replies > 0
      ? prisma.comment.update({
          where: { id },
          data: { isDeleted: true, content: null },
        })
      : prisma.comment.delete({ where: { id } });

  await prisma.$transaction([
    deleteOp,
    prisma.moderationLog.create({
      data: {
        targetType: "COMMENT",
        targetId: id,
        reason: reason as ModerationReason,
        adminId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
