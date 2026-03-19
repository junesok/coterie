import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLikeNotification } from "@/lib/notifications";

// POST /api/posts/[id]/like — 좋아요 추가
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/like">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await ctx.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 좋아요 눌렀는지 확인
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ success: false, error: "이미 좋아요를 눌렀습니다." }, { status: 400 });
  }

  await prisma.like.create({
    data: { postId, userId: session.user.id },
  });

  // 좋아요 알림 생성
  await createLikeNotification(post.authorId, session.user.id, postId);

  const likeCount = await prisma.like.count({ where: { postId } });

  return NextResponse.json({ success: true, likeCount });
}

// DELETE /api/posts/[id]/like — 좋아요 취소
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/like">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await ctx.params;

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "좋아요를 누르지 않았습니다." }, { status: 400 });
  }

  await prisma.like.delete({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  const likeCount = await prisma.like.count({ where: { postId } });

  return NextResponse.json({ success: true, likeCount });
}
