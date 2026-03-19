import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/dashboard — 통계 요약
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, totalPosts, totalComments, newUsersToday] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { totalUsers, totalPosts, totalComments, newUsersToday },
  });
}
