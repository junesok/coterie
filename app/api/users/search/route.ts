import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/search?q=prefix — username 자동완성용 (최대 6명)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: q,
          mode: "insensitive",
        },
        // 본인 제외
        id: { not: session.user.id },
      },
      select: { id: true, username: true, name: true, avatarUrl: true },
      take: 6,
      orderBy: { username: "asc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
