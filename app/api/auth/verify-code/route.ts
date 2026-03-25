import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/auth/verify-code — 인증번호 검증 → reset 토큰 반환
export async function POST(req: NextRequest) {
  try {
    // IP당 10분에 10회 제한 (코드 브루트포스 방지)
    const ip = getIp(req);
    const rl = rateLimit(`verify-code:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and code are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid code." }, { status: 400 });
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        token: code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    // 인증번호 소모 처리 + reset 토큰 생성 (30분 유효)
    const resetToken = createId();
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      }),
    ]);

    return NextResponse.json({ success: true, token: resetToken });
  } catch (error) {
    console.error("[POST /api/auth/verify-code]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
