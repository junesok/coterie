import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, EmailLimitExceededError } from "@/lib/email";

// POST /api/auth/resend-verification — 인증 메일 재발송
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "이메일을 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // 유저가 없어도 동일한 응답 (이메일 노출 방지)
    if (!user) {
      return NextResponse.json({ success: true, message: "메일을 발송했습니다." });
    }

    // 이미 인증된 경우
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: "이미 인증된 계정입니다.", code: "ALREADY_VERIFIED" },
        { status: 400 }
      );
    }

    // 기존 미사용 토큰이 있으면 재활용, 없으면 새로 생성
    const existing = await prisma.emailVerification.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "desc" },
    });

    let token: string;
    if (existing) {
      token = existing.token;
    } else {
      token = createId();
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true, message: "인증 메일을 재발송했습니다." });
  } catch (error) {
    if (error instanceof EmailLimitExceededError) {
      return NextResponse.json(
        {
          success: false,
          error: "오늘 인증 메일 발송 한도를 초과했어요. 내일 다시 시도해 주세요.",
          code: "EMAIL_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    console.error("[POST /api/auth/resend-verification]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
