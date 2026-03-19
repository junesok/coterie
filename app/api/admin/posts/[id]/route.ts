import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ModerationReason } from "@/app/generated/prisma/client";
import { createAdminDeleteNotification } from "@/lib/notifications";

// DELETE /api/admin/posts/[id] — 관리자 게시물 삭제 (사유 포함)
export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/posts/[id]">
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

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json(
      { success: false, error: "게시물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 트랜잭션: 게시물 삭제 + ModerationLog 기록
  await prisma.$transaction([
    prisma.post.delete({ where: { id } }),
    prisma.moderationLog.create({
      data: {
        targetType: "POST",
        targetId: id,
        reason: reason as ModerationReason,
        adminId: session.user.id,
      },
    }),
  ]);

  // 게시물 작성자에게 알림 (비동기)
  createAdminDeleteNotification(
    post.authorId,
    "ADMIN_DELETE_POST",
    id,
    reason as ModerationReason
  ).catch((e) => console.error("[admin notification]", e));

  return NextResponse.json({ success: true });
}
