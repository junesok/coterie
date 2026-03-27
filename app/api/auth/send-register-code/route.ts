import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRegisterVerificationCode } from "@/lib/mailer";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/auth/send-register-code
// 가입 전 이메일 인증 코드 발송 (IP당 10분 3회)
export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    const rl = rateLimit(`send-register-code:${ip}`, 3, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 이미 가입된 이메일 체크
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: "이미 사용 중인 이메일입니다." }, { status: 400 });
    }

    // 기존 미인증 코드 삭제
    await prisma.tempEmailVerification.deleteMany({ where: { email: normalizedEmail } });

    // 6자리 코드 생성
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.tempEmailVerification.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분
      },
    });

    await sendRegisterVerificationCode(normalizedEmail, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/send-register-code]", error);
    return NextResponse.json({ success: false, error: "Failed to send email." }, { status: 500 });
  }
}
