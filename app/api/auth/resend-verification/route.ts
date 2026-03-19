import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, EmailLimitExceededError, EmailDomainError } from "@/lib/email";

// POST /api/auth/resend-verification — 인증 메일 재발송
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "이메일을 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 보안상 동일한 응답 (이메일 존재 여부 노출 방지)
      return NextResponse.json({ success: true });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: "이미 인증된 계정입니다.", code: "ALREADY_VERIFIED" },
        { status: 400 }
      );
    }

    // 유효한 토큰 재활용, 없으면 새로 생성
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/resend-verification]", error);

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

    if (error instanceof EmailDomainError) {
      return NextResponse.json(
        {
          success: false,
          error: "이메일 발송 설정에 문제가 있어요. 관리자에게 문의해 주세요.",
          code: "EMAIL_DOMAIN_ERROR",
          // 개발용 디버그 메시지 (프로덕션에서는 Vercel 로그에서 확인)
          debug: process.env.NODE_ENV !== "production" ? error.resendMessage : undefined,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
