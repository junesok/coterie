import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        author: { select: { id: true, name: true } },
        images: { orderBy: { order: "asc" } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PUT /api/posts/[id] — 게시물 수정 (본인만)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const { content, images } = await req.json();

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "수정 권한이 없습니다." }, { status: 403 });
    }

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "내용을 입력해 주세요." }, { status: 400 });
    }

    // 기존 이미지 삭제 후 새 이미지로 교체
    const updated = await prisma.$transaction(async (tx) => {
      await tx.postImage.deleteMany({ where: { postId: id } });

      return tx.post.update({
        where: { id },
        data: {
          content: content.trim(),
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

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("[PUT /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/posts/[id] — 게시물 삭제 (본인만)
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ success: false, error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ success: false, error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
