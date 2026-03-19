import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/logs — 조치 기록 조회
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const PAGE_SIZE = 30;
  const skip = (page - 1) * PAGE_SIZE;

  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        admin: { select: { username: true, name: true } },
      },
    }),
    prisma.moderationLog.count(),
  ]);

  return NextResponse.json({
    success: true,
    logs,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
