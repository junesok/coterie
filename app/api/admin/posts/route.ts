import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/posts?page=1&pageSize=20&q=keyword
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "20");
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const skip = (page - 1) * pageSize;

  const where = q
    ? { content: { contains: q, mode: "insensitive" as const } }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        author: { select: { id: true, username: true, name: true, isSuspended: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    posts,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
