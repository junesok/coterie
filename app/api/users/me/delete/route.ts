import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

// POST /api/users/me/delete — 계정 탈퇴 신청 (soft delete, 30일 유예)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ success: false, error: "Password is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, isAdmin: true, deletedAt: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }
  if (user.isAdmin) {
    return NextResponse.json({ success: false, error: "Admin accounts cannot be deleted." }, { status: 403 });
  }
  if (user.deletedAt) {
    return NextResponse.json({ success: false, error: "Account is already scheduled for deletion." }, { status: 400 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ success: false, error: "Password is incorrect." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
