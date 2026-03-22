import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

// GET /api/users/[username] — 유저 프로필 + 게시물 목록 (cursor 페이징)
// ?cursor=<postId>  — 이 ID 이후부터 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await getServerSession(authOptions);

    const { username } = await params;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const rawPosts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        content: true,
        createdAt: true,
        images: { select: { url: true, order: true }, orderBy: { order: "asc" } },
        _count: { select: { comments: true } },
        likes: { select: { id: true } },
      },
    });

    const hasMore = rawPosts.length > PAGE_SIZE;
    const pagePosts = hasMore ? rawPosts.slice(0, PAGE_SIZE) : rawPosts;
    const nextCursor = hasMore ? pagePosts[pagePosts.length - 1].id : null;

    const posts = pagePosts.map((post) => ({
      ...post,
      author: { id: user.id, name: user.name, username: user.username, avatarUrl: user.avatarUrl },
      likeCount: post.likes.length,
      likes: undefined,
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        postCount: user._count.posts,
      },
      posts,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("[GET /api/users/[username]]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
