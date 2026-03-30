import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { ModerationReason } from "@/app/generated/prisma/client";
import { createAdminDeleteNotification } from "@/lib/notifications";
import { deleteImagesByUrls } from "@/lib/cloudinary";

// PUT /api/admin/posts/[id] — 숨김(hide) 또는 복구(restore)
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/posts/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { action, reason } = await req.json(); // action: "hide" | "restore"

  if (!["hide", "restore"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "유효한 action이 아닙니다." },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json(
      { success: false, error: "게시물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (action === "hide") {
    if (post.isHidden) {
      return NextResponse.json(
        { success: false, error: "이미 숨김 처리된 게시물입니다." },
        { status: 400 }
      );
    }
    if (!reason || !Object.values(ModerationReason).includes(reason)) {
      return NextResponse.json(
        { success: false, error: "유효한 사유를 선택해 주세요." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.post.update({
        where: { id },
        data: { isHidden: true, hiddenAt: new Date() },
      }),
      prisma.moderationLog.create({
        data: {
          targetType: "POST",
          targetId: id,
          action: "HIDE",
          reason: reason as ModerationReason,
          adminId: session.user.id,
        },
      }),
    ]);

    // 게시물 작성자에게 알림 (비동기)
    createAdminDeleteNotification(
      post.authorId,
      "ADMIN_DELETE_POST",
      id,
      reason as ModerationReason
    ).catch((e) => console.error("[admin notification]", e));

  } else {
    // restore
    if (!post.isHidden) {
      return NextResponse.json(
        { success: false, error: "숨김 처리된 게시물이 아닙니다." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.post.update({
        where: { id },
        data: { isHidden: false, hiddenAt: null },
      }),
      prisma.moderationLog.create({
        data: {
          targetType: "POST",
          targetId: id,
          action: "RESTORE",
          adminId: session.user.id,
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/posts/[id] — 완전 삭제 (isHidden인 게시물만 가능)
export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/posts/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { images: { select: { url: true } } },
  });

  if (!post) {
    return NextResponse.json(
      { success: false, error: "게시물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!post.isHidden) {
    return NextResponse.json(
      { success: false, error: "숨김 처리 후에만 완전 삭제할 수 있습니다." },
      { status: 400 }
    );
  }

  const imageUrls = post.images.map((img) => img.url);

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { postId: id } }),
    prisma.post.delete({ where: { id } }),
    prisma.moderationLog.create({
      data: {
        targetType: "POST",
        targetId: id,
        action: "DELETE",
        adminId: session.user.id,
      },
    }),
  ]);

  // Cloudinary 이미지 완전 삭제 — 반드시 await (서버리스 함수 종료 전에 완료)
  if (imageUrls.length > 0) {
    await deleteImagesByUrls(imageUrls);
  }

  return NextResponse.json({ success: true });
}
