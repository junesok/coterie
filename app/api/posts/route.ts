import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMentionNotifications } from "@/lib/notifications";

const PAGE_SIZE = 5;

// GET /api/posts?page=1&tab=all|friends — 피드 목록
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const tab = req.nextUrl.searchParams.get("tab") ?? "all"; // "all" | "friends"
    const skip = (page - 1) * PAGE_SIZE;
    const userId = session.user.id;

    // friends 탭: 내 친구 ID 목록 조회
    let friendIds: string[] = [];
    if (tab === "friends") {
      const friendships = await prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { senderId: true, receiverId: true },
      });
      friendIds = friendships.map((f) => f.senderId === userId ? f.receiverId : f.senderId);
    }

    const where =
      tab === "friends"
        ? { visibility: "FRIENDS" as const, authorId: { in: [...friendIds, userId] }, author: { isSuspended: false } }
        : { visibility: "PUBLIC" as const, author: { isSuspended: false } };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          author: { select: { id: true, name: true, username: true, avatarUrl: true } },
          images: { orderBy: { order: "asc" }, select: { url: true, order: true } },
          _count: { select: { comments: true, likes: true } },
          likes: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const postsWithLike = posts.map((p) => ({
      ...p,
      likeCount: p._count.likes,
      isLiked: p.likes.length > 0,
      likes: undefined,
    }));

    return NextResponse.json({
      success: true,
      posts: postsWithLike,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/posts — 게시물 작성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { content, images, visibility } = await req.json();

    const hasContent = content && content.trim().length > 0;
    const hasImages = images && images.length > 0;
    if (!hasContent && !hasImages) {
      return NextResponse.json({ success: false, error: "Write something or attach an image." }, { status: 400 });
    }
    if (hasContent && content.trim().length > 500) {
      return NextResponse.json({ success: false, error: "Content must be 500 characters or less." }, { status: 400 });
    }

    if (images && images.length > 3) {
      return NextResponse.json({ success: false, error: "이미지는 최대 3장까지 첨부할 수 있습니다." }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content: content?.trim() ?? "",
        visibility: visibility === "FRIENDS" ? "FRIENDS" : "PUBLIC",
        authorId: session.user.id,
        images: images?.length
          ? {
              create: images.map((url: string, i: number) => ({ url, order: i })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, username: true } },
        images: { orderBy: { order: "asc" } },
      },
    });

    // @멘션 알림 생성 (비동기)
    createMentionNotifications(
      content.trim(),
      session.user.id,
      "MENTION_POST",
      post.id
    ).catch((e) => console.error("[mention notification]", e));

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
