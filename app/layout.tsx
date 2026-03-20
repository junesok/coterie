import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "coterie",
  description: "초대받은 사람들만의 프라이빗 소셜 커뮤니티",
};

// iPhone 홈 바 영역까지 뷰포트 확장
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          {/* 모바일 전용 390px 컨테이너 */}
          <div className="min-h-screen flex flex-col items-center" style={{ background: "var(--bg-desktop)" }}>
            <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "var(--bg-page)" }}>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
