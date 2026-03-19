import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "초대 코드를 입력해 주세요." },
        { status: 400 }
      );
    }

    const invite = await prisma.inviteCode.findUnique({ where: { code } });

    if (!invite || invite.isUsed) {
      return NextResponse.json(
        { success: false, valid: false, error: "유효하지 않은 초대 코드입니다." },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, valid: true });
  } catch (error) {
    console.error("[POST /api/auth/verify-invite-code]", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
