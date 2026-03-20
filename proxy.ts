import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/register"];

// Next.js 16: middleware → proxy (함수명도 proxy로 변경)
export const proxy = withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // 관리자 전용 경로: isAdmin이 아닐 경우 /feed로 리다이렉트
    if (pathname.startsWith("/coterie-admin")) {
      if (!token?.isAdmin) {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        // 공개 경로는 항상 허용
        if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
          return true;
        }

        // 그 외 모든 경로는 토큰 필요
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // _next/static, _next/image, favicon.ico, api/auth 제외한 모든 경로
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
