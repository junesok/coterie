import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/comments/[id] — 댓글 수정 (isEdited = true)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/comments/[id]">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

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
// 핸드오프 규칙: 답글 있으면 소프트 삭제, 없으면 하드 삭제
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/comments/[id]">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    if (comment._count.replies > 0) {
      // 답글 있는 경우: 소프트 삭제 (내용 null, isDeleted = true)
      await prisma.comment.update({
        where: { id },
        data: { content: null, isDeleted: true },
      });
    } else {
      // 답글 없는 경우: 하드 삭제
      await prisma.comment.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/comments/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
