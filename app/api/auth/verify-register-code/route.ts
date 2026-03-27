import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/auth/verify-register-code
// 가입 전 이메일 인증 코드 확인 (IP당 10분 10회)
export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    const rl = rateLimit(`verify-register-code:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and code are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const record = await prisma.tempEmailVerification.findFirst({
      where: { email: normalizedEmail, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "인증 코드를 먼저 요청해 주세요." }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      await prisma.tempEmailVerification.delete({ where: { id: record.id } });
      return NextResponse.json({ success: false, error: "인증 코드가 만료됐습니다. 다시 요청해 주세요.", expired: true }, { status: 400 });
    }

    if (record.code !== String(code).trim()) {
      return NextResponse.json({ success: false, error: "인증 코드가 올바르지 않습니다." }, { status: 400 });
    }

    // 인증 완료 표시
    await prisma.tempEmailVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/verify-register-code]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
