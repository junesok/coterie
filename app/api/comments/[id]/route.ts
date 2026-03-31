import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

// PUT /api/comments/[id] — 댓글 수정 (isEdited = true)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/comments/[id]">) {
  try {
    const { session, error } = await requireAuth();
    if (error || !session) return error;

    const { id } = await ctx.params;
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "내용을 입력해 주세요." }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
      return NextResponse.json({ success: false, error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "수정 권한이 없습니다." }, { status: 403 });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content: content.trim(), isEdited: true },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error) {
    console.error("[PUT /api/comments/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/comments/[id] — 댓글 삭제
// 신고 대기 중: 내용 보존 soft delete (isDeleted=true, content 유지)
// 신고 없음 + 답글 있음: 내용 null soft delete
// 신고 없음 + 답글 없음: hard delete
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/comments/[id]">) {
  try {
    const { session, error } = await requireAuth();
    if (error || !session) return error;

    const { id } = await ctx.params;
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
    }
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "You don't have permission to delete this comment." }, { status: 403 });
    }

    const pendingReportCount = await prisma.report.count({
      where: { targetType: "COMMENT", targetId: id, status: "PENDING" },
    });
    const hasPendingReport = pendingReportCount > 0;

    if (hasPendingReport) {
      // 신고 대기 중: 내용 보존 (관리자가 원본 확인 필요), isDeleted = true
      await prisma.comment.update({
        where: { id },
        data: { isDeleted: true },
      });
    } else if (comment._count.replies > 0) {
      // 답글 있음: 내용 null soft delete
      await prisma.comment.update({
        where: { id },
        data: { content: null, isDeleted: true },
      });
    } else {
      // 신고 없음 + 답글 없음: hard delete
      await prisma.comment.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/comments/[id]]", error);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
