import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 인증 + 정지 상태 확인
 * 쓰기 API(게시물/댓글 작성·수정, 친구 요청 등)에서 사용
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  // DB에서 정지 여부 직접 확인 (JWT 갱신 주기 공백 커버)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuspended: true },
  });

  if (user?.isSuspended) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "정지된 계정입니다.", code: "SUSPENDED" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * 관리자 세션 확인 + DB 재확인
 * JWT 캐시 공백(updateAge) 동안 권한이 회수된 경우를 커버
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 403 }
      ),
    };
  }

  // DB에서 최신 isAdmin 상태 직접 확인
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!dbUser?.isAdmin) {
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
