import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// GET /api/auth/check-username?username=xxx — 유저네임 중복 확인
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ available: false, error: "유저네임을 입력해 주세요." });
  }

  const normalized = username.toLowerCase();

  // 유효성 검사
  if (!USERNAME_REGEX.test(normalized)) {
    return NextResponse.json({
      available: false,
      error: "유저네임은 3~20자의 영문 소문자, 숫자, 언더스코어만 사용할 수 있습니다.",
    });
  }

  // 예약어 확인
  if (normalized === "coterie_admin") {
    return NextResponse.json({ available: false, error: "사용할 수 없는 유저네임입니다." });
  }

  // 중복 확인
  const existing = await prisma.user.findUnique({ where: { username: normalized } });

  return NextResponse.json({ available: !existing });
}
