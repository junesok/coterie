import { prisma } from "@/lib/prisma";
import { deleteImagesByUrls } from "@/lib/cloudinary";

/**
 * Permanently deletes a user account and all associated data.
 * FK constraint ordering is critical — do not change without reviewing schema.
 */
export async function hardDeleteUser(userId: string): Promise<void> {
  // Collect all Cloudinary image URLs before deleting DB records
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatarUrl: true,
      posts: {
        select: { images: { select: { url: true } } },
      },
    },
  });

  if (!target) return;

  const postImageUrls = target.posts.flatMap((p) => p.images.map((i) => i.url));
  const allImageUrls = [
    ...(target.avatarUrl ? [target.avatarUrl] : []),
    ...postImageUrls,
  ];

  await prisma.$transaction([
    // ① Nullify usedById on invite codes this user used
    prisma.inviteCode.updateMany({
      where: { usedById: userId },
      data: { usedById: null, isUsed: false },
    }),
    // ② Nullify invitedById on users this account invited
    prisma.user.updateMany({
      where: { invitedById: userId },
      data: { invitedById: null },
    }),
    // ③ Delete email verification records
    prisma.emailVerification.deleteMany({ where: { userId } }),
    // ④ Delete moderation logs where this user was admin (safety net for non-admins: 0 rows)
    prisma.moderationLog.deleteMany({ where: { adminId: userId } }),
    // ⑤ Delete received notifications
    prisma.notification.deleteMany({ where: { userId } }),
    // ⑥ Delete likes
    prisma.like.deleteMany({ where: { userId } }),
    // ⑦ Delete comments (cascade → replies)
    prisma.comment.deleteMany({ where: { authorId: userId } }),
    // ⑧ Delete owned invite codes (usedById already nullified in ①)
    prisma.inviteCode.deleteMany({ where: { ownerId: userId } }),
    // ⑨ Delete posts (cascade → PostImage, Comment, Like)
    prisma.post.deleteMany({ where: { authorId: userId } }),
    // ⑩ Delete friendships (onDelete: Cascade already handles, but explicit for clarity)
    prisma.friendship.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    }),
    // ⑪ Delete the user record
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Delete Cloudinary images after DB records are gone
  if (allImageUrls.length > 0) {
    await deleteImagesByUrls(allImageUrls);
  }
}
