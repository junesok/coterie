import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/comments?page=1&pageSize=20&q=keyword&postId=xxx
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(req.nextUrl.searchParams.get("pageSize") ?? "20") || 20, 100);
  const q = (req.nextUrl.searchParams.get("q")?.trim() ?? "").slice(0, 200);
  const postId = req.nextUrl.searchParams.get("postId");
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { isDeleted: false };
  if (postId) where.postId = postId;
  if (q) where.content = { contains: q, mode: "insensitive" };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        author: { select: { id: true, username: true, name: true, isSuspended: true } },
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    comments,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
