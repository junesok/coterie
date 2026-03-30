import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { ModerationReason } from "@/app/generated/prisma/client";
import { createAdminDeleteNotification } from "@/lib/notifications";

// PUT /api/admin/comments/[id] — 숨김(hide) 또는 복구(restore)
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/comments/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { action, reason } = await req.json(); // action: "hide" | "restore"

  if (!["hide", "restore"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "유효한 action이 아닙니다." },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.isDeleted) {
    return NextResponse.json(
      { success: false, error: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (action === "hide") {
    if (comment.isHidden) {
      return NextResponse.json(
        { success: false, error: "이미 숨김 처리된 댓글입니다." },
        { status: 400 }
      );
    }
    if (!reason || !Object.values(ModerationReason).includes(reason)) {
      return NextResponse.json(
        { success: false, error: "유효한 사유를 선택해 주세요." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.comment.update({
        where: { id },
        data: { isHidden: true, hiddenAt: new Date() },
      }),
      prisma.moderationLog.create({
        data: {
          targetType: "COMMENT",
          targetId: id,
          action: "HIDE",
          reason: reason as ModerationReason,
          adminId: session.user.id,
        },
      }),
    ]);

    // 댓글 작성자에게 알림 (비동기)
    createAdminDeleteNotification(
      comment.authorId,
      "ADMIN_DELETE_COMMENT",
      comment.postId,
      reason as ModerationReason,
      id
    ).catch((e) => console.error("[admin notification]", e));

  } else {
    // restore
    if (!comment.isHidden) {
      return NextResponse.json(
        { success: false, error: "숨김 처리된 댓글이 아닙니다." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.comment.update({
        where: { id },
        data: { isHidden: false, hiddenAt: null },
      }),
      prisma.moderationLog.create({
        data: {
          targetType: "COMMENT",
          targetId: id,
          action: "RESTORE",
          adminId: session.user.id,
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/comments/[id] — 완전 삭제 (isHidden인 댓글만 가능)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/comments/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json(
      { success: false, error: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!comment.isHidden) {
    return NextResponse.json(
      { success: false, error: "숨김 처리 후에만 완전 삭제할 수 있습니다." },
      { status: 400 }
    );
  }

  // 완전 삭제 (답글이 있으면 onDelete: Cascade로 함께 삭제됨)
  await prisma.$transaction([
    prisma.comment.delete({ where: { id } }),
    prisma.moderationLog.create({
      data: {
        targetType: "COMMENT",
        targetId: id,
        action: "DELETE",
        adminId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
