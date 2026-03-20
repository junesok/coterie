import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/mailer";

// POST /api/auth/forgot-password — 이메일 입력 → 6자리 인증번호 발송
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // 보안상: 존재하지 않는 이메일도 동일한 성공 응답
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // 기존 미사용 토큰 무효화
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 6자리 숫자 인증번호 생성
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분
      },
    });

    await sendPasswordResetCode(email, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
