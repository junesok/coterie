import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

// POST /api/users/me/recover — 탈퇴 철회 (deletedAt 초기화)
export async function POST(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, deletedAt: true },
  });

  if (!user || !user.deletedAt) {
    return NextResponse.json({ success: false, error: "No pending deletion found." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ success: true });
}
