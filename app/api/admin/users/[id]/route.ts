import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { deleteImagesByUrls } from "@/lib/cloudinary";

// PUT /api/admin/users/[id] — 계정 정지 / 해제
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id } = await ctx.params;
  const { action, reason } = await req.json();

  if (action !== "suspend" && action !== "unsuspend") {
    return NextResponse.json(
      { success: false, error: "유효하지 않은 action입니다." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, isAdmin: true } });
  if (!target) {
    return NextResponse.json({ success: false, error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.isAdmin) {
    return NextResponse.json({ success: false, error: "관리자 계정은 정지할 수 없습니다." }, { status: 403 });
  }

  const isSuspending = action === "suspend";

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        isSuspended: isSuspending,
        suspendedAt: isSuspending ? new Date() : null,
        suspendedReason: isSuspending ? (reason ?? null) : null,
      },
    }),
    prisma.moderationLog.create({
      data: {
        targetType: "USER",
        targetId: id,
        action: isSuspending ? "SUSPEND" : "UNSUSPEND",
        reason: reason ?? "OTHER",
        adminId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id] — 계정 완전 삭제 (정지된 계정만 가능)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { id: userId } = await ctx.params;

  // ── 대상 계정 조회 및 안전 검사 ──
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isAdmin: true,
      isSuspended: true,
      avatarUrl: true,
      posts: {
        select: {
          images: { select: { url: true } },
        },
      },
    },
  });

  if (!target) {
    return NextResponse.json({ success: false, error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.isAdmin) {
    return NextResponse.json({ success: false, error: "관리자 계정은 삭제할 수 없습니다." }, { status: 403 });
  }
  if (!target.isSuspended) {
    return NextResponse.json({ success: false, error: "정지된 계정만 완전 삭제할 수 있습니다." }, { status: 400 });
  }

  // ── Cloudinary 삭제 대상 URL 수집 ──
  const postImageUrls = target.posts.flatMap((p) => p.images.map((i) => i.url));
  const allImageUrls = [
    ...(target.avatarUrl ? [target.avatarUrl] : []),
    ...postImageUrls,
  ];

  // ── 순서를 지켜 모든 데이터 삭제 (트랜잭션) ──
  await prisma.$transaction([

    // ① FK 해제: 이 계정이 사용한 초대코드의 usedById 참조 제거
    //    (InviteCode.usedById → User.id FK 제약 해제)
    prisma.inviteCode.updateMany({
      where: { usedById: userId },
      data: { usedById: null, isUsed: false },
    }),

    // ② FK 해제: 이 계정이 초대한 사용자들의 invitedById 참조 제거
    //    (User.invitedById → User.id 자기 참조 FK 제약 해제)
    prisma.user.updateMany({
      where: { invitedById: userId },
      data: { invitedById: null },
    }),

    // ③ 이메일 인증 기록 삭제 (FK 없지만 orphan 방지)
    prisma.emailVerification.deleteMany({ where: { userId } }),

    // ④ ModerationLog 삭제 (adminId FK — 비관리자이므로 보통 0건, 안전망)
    prisma.moderationLog.deleteMany({ where: { adminId: userId } }),

    // ⑤ 수신한 알림 삭제 (Notification.userId → User.id)
    prisma.notification.deleteMany({ where: { userId } }),

    // ⑥ 이 계정이 누른 좋아요 삭제 (Like.userId → User.id)
    prisma.like.deleteMany({ where: { userId } }),

    // ⑦ 이 계정이 작성한 댓글 삭제 (Comment.authorId → User.id)
    //    부모 댓글 삭제 시 onDelete: Cascade → 다른 사용자의 답글도 함께 삭제됨
    prisma.comment.deleteMany({ where: { authorId: userId } }),

    // ⑧ 이 계정 소유의 초대코드 삭제 (InviteCode.ownerId → User.id)
    //    사용된 코드도 포함 (사용자 측 FK는 ①에서 이미 해제됨)
    prisma.inviteCode.deleteMany({ where: { ownerId: userId } }),

    // ⑨ 이 계정의 게시물 삭제 (Post.authorId → User.id)
    //    onDelete: Cascade → PostImage, Comment, Like 일괄 삭제
    prisma.post.deleteMany({ where: { authorId: userId } }),

    // ⑩ 친구 관계 삭제 (Friendship.senderId/receiverId → User.id)
    //    이미 onDelete: Cascade지만 명시적으로 처리
    prisma.friendship.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    }),

    // ⑪ 계정 삭제 (모든 FK 참조 해제·삭제 완료 후)
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // ── Cloudinary 이미지 완전 삭제 (await — 서버리스 함수 종료 전에 완료) ──
  if (allImageUrls.length > 0) {
    await deleteImagesByUrls(allImageUrls);
  }

  return NextResponse.json({ success: true });
}
