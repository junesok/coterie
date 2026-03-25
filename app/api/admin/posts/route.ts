import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/posts — 전체 게시물 목록
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const PAGE_SIZE = 20;
  const skip = (page - 1) * PAGE_SIZE;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        author: { select: { id: true, username: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count(),
  ]);

  return NextResponse.json({
    success: true,
    posts,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
