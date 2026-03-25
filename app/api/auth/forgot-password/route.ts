import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/mailer";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/auth/forgot-password — 이메일 입력 → 6자리 인증번호 발송
export async function POST(req: NextRequest) {
  // 타이밍 공격 방지: 항상 일정 시간 후 응답
  const startTime = Date.now();
  const minDelay = 500;

  async function respond(body: object, status = 200) {
    const elapsed = Date.now() - startTime;
    if (elapsed < minDelay) {
      await new Promise((r) => setTimeout(r, minDelay - elapsed));
    }
    return NextResponse.json(body, { status });
  }

  try {
    // IP당 15분에 3회 제한
    const ip = getIp(req);
    const rl = rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (!rl.ok) {
      return respond({ success: false, error: "Too many requests. Please try again later." }, 429);
    }

    const { email } = await req.json();

    if (!email) {
      return respond({ success: false, error: "Email is required." }, 400);
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // 보안상: 존재하지 않는 이메일도 동일한 성공 응답 (타이밍도 동일하게)
    if (!user) {
      return respond({ success: true });
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

    return respond({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return respond({ success: false, error: "Failed to send email. Please try again later." }, 500);
  }
}
