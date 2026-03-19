import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * 관리자 세션 확인 유틸
 * 관리자가 아니면 403 응답을 반환하고 null을 리턴
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 403 }
      ),
    };
  }
  return { session, error: null };
}
