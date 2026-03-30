import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 15, 50);

  const likes = await prisma.like.findMany({
    where: {
      userId: session!.user.id,
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      post: {
        select: {
          id: true,
          content: true,
          visibility: true,
          createdAt: true,
          author: {
            select: { id: true, username: true, name: true, avatarUrl: true },
          },
          images: {
            select: { url: true, order: true },
            orderBy: { order: "asc" },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      },
    },
  });

  // Post가 삭제된 경우(cascade로 Like도 지워지나 혹시 남은 경우) 제외
  const validLikes = likes.filter((l) => l.post !== null);

  const hasMore = validLikes.length > limit;
  const items = hasMore ? validLikes.slice(0, limit) : validLikes;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ likes: items, nextCursor });
}
