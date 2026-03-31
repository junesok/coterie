import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/reports?status=PENDING|DISMISSED|ACTIONED
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";

  const reports = await prisma.report.findMany({
    where: { status: status as never },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      reporter: { select: { id: true, username: true, name: true } },
    },
    take: 100,
  });

  // 신고 대상 콘텐츠 조회 (post/comment)
  const postIds = reports.filter((r) => r.targetType === "POST").map((r) => r.targetId);
  const commentIds = reports.filter((r) => r.targetType === "COMMENT").map((r) => r.targetId);

  const [posts, comments] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            content: true,
            isHidden: true,
            deletedAt: true,
            createdAt: true,
            images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
            author: { select: { id: true, username: true, name: true } },
          },
        })
      : [],
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            content: true,
            isDeleted: true,
            isHidden: true,
            createdAt: true,
            post: { select: { id: true, content: true } },
            author: { select: { id: true, username: true, name: true } },
          },
        })
      : [],
  ]);

  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));
  const commentMap = Object.fromEntries(comments.map((c) => [c.id, c]));

  const enriched = reports.map((r) => ({
    ...r,
    target: r.targetType === "POST" ? (postMap[r.targetId] ?? null) : (commentMap[r.targetId] ?? null),
  }));

  return NextResponse.json({ success: true, reports: enriched });
}
