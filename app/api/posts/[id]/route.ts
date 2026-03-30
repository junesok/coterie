import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImagesByUrls } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/auth-guard";

// GET /api/posts/[id] — 게시물 상세
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await ctx.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: { orderBy: { order: "asc" } },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
      },
    });

    if (!post || post.isHidden) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    // FRIENDS 게시물: 작성자 본인 또는 친구만 접근 가능
    if (post.visibility === "FRIENDS" && post.authorId !== session.user.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: session.user.id, receiverId: post.authorId },
            { senderId: post.authorId, receiverId: session.user.id },
          ],
        },
      });
      if (!friendship) {
        return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const { likes, ...rest } = post;
    return NextResponse.json({
      success: true,
      post: { ...rest, likeCount: post._count.likes, isLiked: likes.length > 0 },
    });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PUT /api/posts/[id] — 게시물 수정 (본인만)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const { session, error } = await requireAuth();
    if (error || !session) return error;

    const { id } = await ctx.params;
    const { content, images, visibility } = await req.json();

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "수정 권한이 없습니다." }, { status: 403 });
    }

    const hasContent = content && content.trim().length > 0;
    const hasImages = images && images.length > 0;
    if (!hasContent && !hasImages) {
      return NextResponse.json({ success: false, error: "Write something or attach an image." }, { status: 400 });
    }
    if (hasContent && content.trim().length > 500) {
      return NextResponse.json({ success: false, error: "Content must be 500 characters or less." }, { status: 400 });
    }

    // 기존 이미지 URL 수집 → Cloudinary + DB에서 삭제 후 새 이미지로 교체
    const oldImages = await prisma.postImage.findMany({
      where: { postId: id },
      select: { url: true },
    });
    const newImageUrls: string[] = images ?? [];
    const removedUrls = oldImages
      .map((img) => img.url)
      .filter((url) => !newImageUrls.includes(url));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.postImage.deleteMany({ where: { postId: id } });

      return tx.post.update({
        where: { id },
        data: {
          content: content?.trim() ?? "",
          visibility: visibility === "FRIENDS" ? "FRIENDS" : "PUBLIC",
          images: images?.length
            ? { create: images.map((url: string, i: number) => ({ url, order: i })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, name: true } },
          images: { orderBy: { order: "asc" } },
        },
      });
    });

    // DB 트랜잭션 완료 후 Cloudinary에서 제거된 이미지 삭제 (비동기, 실패 무시)
    if (removedUrls.length > 0) {
      deleteImagesByUrls(removedUrls).catch(() => {});
    }

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("[PUT /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/posts/[id] — 게시물 삭제 (본인만)
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const { session, error } = await requireAuth();
    if (error || !session) return error;

    const { id } = await ctx.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { images: { select: { url: true } } },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    const imageUrls = post.images.map((img) => img.url);

    await prisma.$transaction([
      // 해당 게시물과 연결된 알림 정리
      prisma.notification.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    // DB 삭제 완료 후 Cloudinary 이미지 삭제 (비동기, 실패 무시)
    if (imageUrls.length > 0) {
      deleteImagesByUrls(imageUrls).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
