import { prisma } from "@/lib/prisma";
import { NotificationType, ModerationReason } from "@/app/generated/prisma/client";

/**
 * @멘션 파싱: content에서 @username 패턴 추출
 * 반환: username 배열 (소문자, 중복 제거)
 */
export function parseMentions(content: string): string[] {
  const matches = content.match(/@([a-z0-9_]{3,20})/gi) ?? [];
  const usernames = matches.map((m) => m.slice(1).toLowerCase());
  return [...new Set(usernames)];
}

/**
 * @멘션된 유저들에게 알림 생성
 */
export async function createMentionNotifications(
  content: string,
  actorId: string,
  type: "MENTION_POST" | "MENTION_COMMENT",
  postId: string,
  commentId?: string
): Promise<void> {
  const usernames = parseMentions(content);
  if (usernames.length === 0) return;

  // 멘션된 유저 조회 (본인 제외)
  const users = await prisma.user.findMany({
    where: {
      username: { in: usernames },
      id: { not: actorId },
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      type: type as NotificationType,
      userId: u.id,
      actorId,
      postId,
      commentId: commentId ?? null,
    })),
    skipDuplicates: true,
  });
}

/**
 * 댓글 알림 생성 (게시물 작성자에게)
 */
export async function createCommentNotification(
  postAuthorId: string,
  actorId: string,
  postId: string,
  commentId: string
): Promise<void> {
  // 본인 댓글이면 알림 미발생
  if (postAuthorId === actorId) return;

  await prisma.notification.create({
    data: {
      type: "COMMENT",
      userId: postAuthorId,
      actorId,
      postId,
      commentId,
    },
  });
}

/**
 * 답글 알림 생성
 * - 부모 댓글 작성자에게 알림 (답글 작성자 본인이면 skip)
 * - 게시물 작성자에게 알림 (답글 작성자 본인이거나, 이미 부모 댓글 작성자와 동일하면 skip)
 */
export async function createReplyNotifications(
  postAuthorId: string,
  parentCommentAuthorId: string,
  actorId: string,
  postId: string,
  commentId: string
): Promise<void> {
  const notifications = [];

  // 부모 댓글 작성자에게 알림 (본인 제외)
  if (parentCommentAuthorId !== actorId) {
    notifications.push({
      type: "COMMENT" as NotificationType,
      userId: parentCommentAuthorId,
      actorId,
      postId,
      commentId,
    });
  }

  // 게시물 작성자에게 알림 (본인 제외, 부모 댓글 작성자와 중복이면 제외)
  if (postAuthorId !== actorId && postAuthorId !== parentCommentAuthorId) {
    notifications.push({
      type: "COMMENT" as NotificationType,
      userId: postAuthorId,
      actorId,
      postId,
      commentId,
    });
  }

  if (notifications.length === 0) return;

  await prisma.notification.createMany({ data: notifications, skipDuplicates: true });
}

/**
 * 좋아요 알림 생성 (게시물 작성자에게)
 */
export async function createLikeNotification(
  postAuthorId: string,
  actorId: string,
  postId: string
): Promise<void> {
  if (postAuthorId === actorId) return;

  // 이미 좋아요 알림이 있으면 중복 생성 안함
  const existing = await prisma.notification.findFirst({
    where: { type: "LIKE", userId: postAuthorId, actorId, postId },
  });
  if (existing) return;

  await prisma.notification.create({
    data: {
      type: "LIKE",
      userId: postAuthorId,
      actorId,
      postId,
    },
  });
}

/**
 * 관리자 삭제 알림 생성 (콘텐츠 작성자에게)
 */
export async function createAdminDeleteNotification(
  targetAuthorId: string,
  type: "ADMIN_DELETE_POST" | "ADMIN_DELETE_COMMENT",
  postId: string,
  reason: ModerationReason,
  commentId?: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      type: type as NotificationType,
      userId: targetAuthorId,
      actorId: null,
      postId,
      commentId: commentId ?? null,
      reason,
    },
  });
}
