import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInviteCodesForUser } from "@/lib/invite";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    // 토큰 조회
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    // 이미 사용된 토큰
    if (verification.usedAt) {
      return NextResponse.redirect(
        new URL("/login?error=already-verified", req.url)
      );
    }

    // 만료 여부 확인
    if (new Date() > verification.expiresAt) {
      return NextResponse.redirect(
        new URL("/login?error=token-expired", req.url)
      );
    }

    // 이메일 인증 처리
    await prisma.$transaction(async (tx) => {
      // 유저 인증 상태 업데이트
      await tx.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });

      // 토큰 사용 처리
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });
    });

    // 초대 코드 3개 자동 발급
    await createInviteCodesForUser(verification.userId);

    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch (error) {
    console.error("[GET /api/auth/verify-email]", error);
    return NextResponse.redirect(
      new URL("/login?error=server-error", req.url)
    );
  }
}
