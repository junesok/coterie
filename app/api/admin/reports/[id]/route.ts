import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { ModerationReason } from "@/app/generated/prisma/client";
import { deleteImagesByUrls } from "@/lib/cloudinary";

// PUT /api/admin/reports/[id] — 신고 처리
// action: "dismiss" | "hide_post" | "delete_post" | "hide_comment" | "delete_comment"
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/reports/[id]">) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { action, reason } = await req.json();

  const VALID_ACTIONS = ["dismiss", "hide_post", "delete_post", "hide_comment", "delete_comment"];
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ success: false, error: "유효하지 않은 action입니다." }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ success: false, error: "신고를 찾을 수 없습니다." }, { status: 404 });
  }
  if (report.status !== "PENDING") {
    return NextResponse.json({ success: false, error: "이미 처리된 신고입니다." }, { status: 400 });
  }

  const now = new Date();

  if (action === "dismiss") {
    // 신고 기각 — 신고된 콘텐츠가 사용자에 의해 soft delete된 경우 완전 삭제
    await prisma.report.update({
      where: { id },
      data: { status: "DISMISSED", resolvedAt: now, resolvedById: session.user.id },
    });

    if (report.targetType === "POST") {
      const post = await prisma.post.findUnique({
        where: { id: report.targetId },
        include: { images: { select: { url: true } } },
      });
      // 사용자 soft delete된 게시물이고 다른 pending 신고 없으면 완전 삭제
      if (post?.deletedAt) {
        const otherPending = await prisma.report.count({
          where: { targetId: report.targetId, targetType: "POST", status: "PENDING" },
        });
        if (otherPending === 0) {
          const imageUrls = post.images.map((i) => i.url);
          await prisma.$transaction([
            prisma.notification.deleteMany({ where: { postId: report.targetId } }),
            prisma.post.delete({ where: { id: report.targetId } }),
          ]);
          if (imageUrls.length > 0) await deleteImagesByUrls(imageUrls);
        }
      }
    } else {
      // COMMENT: soft delete된 댓글이고 다른 pending 신고 없으면 완전 삭제
      const comment = await prisma.comment.findUnique({
        where: { id: report.targetId },
        include: { _count: { select: { replies: true } } },
      });
      if (comment?.isDeleted) {
        const otherPending = await prisma.report.count({
          where: { targetId: report.targetId, targetType: "COMMENT", status: "PENDING" },
        });
        if (otherPending === 0) {
          if (comment._count.replies > 0) {
            // 답글 있으면 내용만 null (자리 유지)
            await prisma.comment.update({ where: { id: report.targetId }, data: { content: null } });
          } else {
            await prisma.comment.delete({ where: { id: report.targetId } });
          }
        }
      }
    }
    return NextResponse.json({ success: true });
  }

  // 신고 조치 처리 (hide/delete)
  const moderationReason: ModerationReason = Object.values(ModerationReason).includes(reason)
    ? reason
    : "OTHER";

  if (action === "hide_post") {
    await prisma.$transaction([
      prisma.post.update({ where: { id: report.targetId }, data: { isHidden: true, hiddenAt: now } }),
      prisma.moderationLog.create({
        data: { targetType: "POST", targetId: report.targetId, action: "HIDE", reason: moderationReason, adminId: session.user.id },
      }),
      prisma.report.update({
        where: { id },
        data: { status: "ACTIONED", resolvedAt: now, resolvedById: session.user.id },
      }),
    ]);
  } else if (action === "delete_post") {
    const post = await prisma.post.findUnique({
      where: { id: report.targetId },
      include: { images: { select: { url: true } } },
    });
    if (!post) return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });

    const imageUrls = post.images.map((i) => i.url);
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { postId: report.targetId } }),
      prisma.report.updateMany({ where: { targetId: report.targetId, targetType: "POST" }, data: { status: "ACTIONED", resolvedAt: now, resolvedById: session.user.id } }),
      prisma.moderationLog.create({
        data: { targetType: "POST", targetId: report.targetId, action: "DELETE", reason: moderationReason, adminId: session.user.id },
      }),
      prisma.post.delete({ where: { id: report.targetId } }),
    ]);
    if (imageUrls.length > 0) await deleteImagesByUrls(imageUrls);
  } else if (action === "hide_comment") {
    await prisma.$transaction([
      prisma.comment.update({ where: { id: report.targetId }, data: { isHidden: true, hiddenAt: now } }),
      prisma.moderationLog.create({
        data: { targetType: "COMMENT", targetId: report.targetId, action: "HIDE", reason: moderationReason, adminId: session.user.id },
      }),
      prisma.report.update({
        where: { id },
        data: { status: "ACTIONED", resolvedAt: now, resolvedById: session.user.id },
      }),
    ]);
  } else if (action === "delete_comment") {
    const comment = await prisma.comment.findUnique({
      where: { id: report.targetId },
      include: { _count: { select: { replies: true } } },
    });
    if (!comment) return NextResponse.json({ success: false, error: "댓글을 찾을 수 없습니다." }, { status: 404 });

    await prisma.$transaction([
      prisma.report.updateMany({ where: { targetId: report.targetId, targetType: "COMMENT" }, data: { status: "ACTIONED", resolvedAt: now, resolvedById: session.user.id } }),
      prisma.moderationLog.create({
        data: { targetType: "COMMENT", targetId: report.targetId, action: "DELETE", reason: moderationReason, adminId: session.user.id },
      }),
      comment._count.replies > 0
        ? prisma.comment.update({ where: { id: report.targetId }, data: { content: null, isDeleted: true, isHidden: false } })
        : prisma.comment.delete({ where: { id: report.targetId } }),
    ]);
  }

  return NextResponse.json({ success: true });
}
