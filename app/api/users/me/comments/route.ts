import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  const comments = await prisma.comment.findMany({
    where: {
      authorId: session!.user.id,
      isDeleted: false,
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          content: true,
          author: {
            select: { username: true, avatarUrl: true },
          },
          images: {
            select: { url: true, order: true },
            orderBy: { order: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  // 게시물이 삭제된 댓글 제외 (혹시 남아 있는 경우)
  const validComments = comments.filter((c) => c.post !== null);

  const hasMore = validComments.length > limit;
  const items = hasMore ? validComments.slice(0, limit) : validComments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ comments: items, nextCursor });
}
