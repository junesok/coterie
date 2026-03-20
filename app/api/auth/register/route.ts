import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createInviteCodesForUser } from "@/lib/invite";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, inviteCode } = await req.json();

    // 입력값 검증
    if (!name || !username || !email || !password || !inviteCode) {
      return NextResponse.json(
        { success: false, error: "모든 필드를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 유저네임 유효성 검사
    const normalizedUsername = username.toLowerCase();
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return NextResponse.json(
        { success: false, error: "유저네임은 3~20자의 영문 소문자, 숫자, 언더스코어만 사용할 수 있습니다." },
        { status: 400 }
      );
    }

    if (normalizedUsername === "coterie_admin") {
      return NextResponse.json(
        { success: false, error: "사용할 수 없는 유저네임입니다." },
        { status: 400 }
      );
    }

    // 초대 코드 유효성 확인
    const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.isUsed) {
      return NextResponse.json(
        { success: false, error: "유효하지 않거나 이미 사용된 초대 코드입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 유저네임 중복 확인
    const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 유저네임입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 12);

    // 트랜잭션: 유저 생성 + 초대코드 사용 처리
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          username: normalizedUsername,
          email,
          passwordHash,
          isVerified: true,
          invitedById: invite.ownerId,
        },
      });

      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { isUsed: true, usedById: user.id, usedAt: new Date() },
      });

      return user;
    });

    // 신규 가입자에게 초대 코드 3개 즉시 지급
    await createInviteCodesForUser(newUser.id, 3);

    return NextResponse.json(
      { success: true, message: "가입 완료." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
