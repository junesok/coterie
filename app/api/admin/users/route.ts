import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/users — 유저 목록
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      isVerified: true,
      isAdmin: true,
      createdAt: true,
      invitedBy: { select: { username: true, name: true } },
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({ success: true, users });
}
