import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/comments — 댓글 목록 (postId 필터 가능)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const postId = req.nextUrl.searchParams.get("postId");
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const PAGE_SIZE = 30;
  const skip = (page - 1) * PAGE_SIZE;

  const where = postId ? { postId, isDeleted: false } : { isDeleted: false };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        author: { select: { id: true, username: true, name: true } },
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    comments,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
