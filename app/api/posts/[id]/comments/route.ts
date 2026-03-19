import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCommentNotification,
  createReplyNotifications,
  createMentionNotifications,
} from "@/lib/notifications";

// GET /api/posts/[id]/comments — 댓글 + 답글 목록
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]/comments">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: postId } = await ctx.params;

    // 최상위 댓글만 조회 (parentId = null), 답글은 replies로 중첩
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, username: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, username: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("[GET /api/posts/[id]/comments]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments — 댓글 또는 답글 작성
export async function POST(req: NextRequest, ctx: RouteContext<"/api/posts/[id]/comments">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: postId } = await ctx.params;
    const { content, parentId } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "내용을 입력해 주세요." }, { status: 400 });
    }

    // 게시물 조회 (작성자 알림용)
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    // 답글인 경우 부모 댓글 존재 여부 확인
    let parentCommentAuthorId: string | null = null;
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ success: false, error: "유효하지 않은 댓글입니다." }, { status: 400 });
      }
      // 답글에 대한 답글은 허용하지 않음 (1단계 중첩만)
      if (parent.parentId !== null) {
        return NextResponse.json({ success: false, error: "답글에는 답글을 달 수 없습니다." }, { status: 400 });
      }
      parentCommentAuthorId = parent.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: session.user.id,
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { id: true, name: true, username: true } },
      },
    });

    // 비동기 알림 생성 (await 없이 — 실패해도 댓글 작성은 성공)
    const mentionType = parentId ? "MENTION_COMMENT" : "MENTION_POST";
    const notifTask = parentId && parentCommentAuthorId
      // 답글: 부모 댓글 작성자 + 게시물 작성자 모두에게 (중복·본인 제외)
      ? createReplyNotifications(post.authorId, parentCommentAuthorId, session.user.id, postId, comment.id)
      // 일반 댓글: 게시물 작성자에게만
      : createCommentNotification(post.authorId, session.user.id, postId, comment.id);

    Promise.allSettled([
      notifTask,
      createMentionNotifications(content.trim(), session.user.id, mentionType, postId, comment.id),
    ]).catch((e) => console.error("[notification]", e));

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts/[id]/comments]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
