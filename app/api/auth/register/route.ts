import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, EmailLimitExceededError } from "@/lib/email";

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

    // 이메일 중복 확인 — 이미 가입됐지만 미인증인 경우도 체크
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      // 미인증 상태면 "인증 메일 재발송 가능" 안내
      if (!existingEmail.isVerified) {
        return NextResponse.json(
          {
            success: false,
            error: "이미 가입된 이메일입니다. 인증 메일을 받지 못하셨다면 재발송해 주세요.",
            code: "UNVERIFIED_EMAIL",
          },
          { status: 400 }
        );
      }
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

    // 트랜잭션: 유저 생성 + 초대코드 사용 처리 + 인증 토큰 생성을 한 번에
    const token = createId();
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          username: normalizedUsername,
          email,
          passwordHash,
          invitedById: invite.ownerId,
        },
      });

      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { isUsed: true, usedById: newUser.id, usedAt: new Date() },
      });

      await tx.emailVerification.create({
        data: {
          userId: newUser.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return newUser;
    });

    // 이메일 발송 — 실패해도 가입은 이미 완료됨
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("[register] 이메일 발송 실패:", emailError);

      if (emailError instanceof EmailLimitExceededError) {
        return NextResponse.json(
          {
            success: true,
            emailFailed: true,
            userId: user.id,
            error: "가입은 완료됐어요. 오늘 인증 메일 발송 한도를 초과했습니다. /verify-email에서 내일 재발송해 주세요.",
            code: "EMAIL_LIMIT_EXCEEDED",
          },
          { status: 201 }
        );
      }

      // 기타 이메일 오류: 가입 완료 + 재발송 안내
      return NextResponse.json(
        {
          success: true,
          emailFailed: true,
          userId: user.id,
          error: "가입은 완료됐어요. 인증 메일 발송에 실패했습니다. 인증 페이지에서 재발송해 주세요.",
          code: "EMAIL_SEND_FAILED",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: true, message: "가입 완료. 이메일을 확인해 주세요." },
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
