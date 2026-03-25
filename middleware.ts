import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/suspended",
  "/api/auth",
  "/_next",
  "/favicon",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  // 미로그인 → 로그인 페이지로
  if (!token) {
    if (pathname.startsWith("/api/")) return NextResponse.next(); // API는 각 route에서 처리
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 정지된 계정 → /suspended로 리다이렉트 (API 요청은 각 route에서 처리)
  if (token.isSuspended && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
