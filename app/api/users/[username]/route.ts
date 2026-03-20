import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[username] — 유저 프로필 + 게시물 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await getServerSession(authOptions); // 인증 확인 (로그인 필수)

    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        posts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            images: { select: { url: true, order: true }, orderBy: { order: "asc" } },
            _count: { select: { comments: true } },
            likes: { select: { id: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    // 게시물에 likeCount 추가
    const posts = user.posts.map((post) => ({
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
      },
      posts,
    });
  } catch (error) {
    console.error("[GET /api/users/[username]]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
