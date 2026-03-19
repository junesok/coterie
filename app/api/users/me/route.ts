import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PUT /api/users/me — 이름 / 비밀번호 변경
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await req.json();
    const updateData: { name?: string; passwordHash?: string } = {};

    // 이름 변경
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // 비밀번호 변경
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: "현재 비밀번호를 입력해 주세요." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "새 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) return NextResponse.json({ success: false, error: "유저를 찾을 수 없습니다." }, { status: 404 });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ success: false, error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "변경할 내용이 없습니다." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[PUT /api/users/me]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
