import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "coterie",
  description: "coterie",
  openGraph: {
    title: "coterie",
    description: "coterie",
    images: [{ url: "/coterie.jpg", width: 1200, height: 630, alt: "coterie" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "coterie",
    description: "coterie",
    images: ["/coterie.jpg"],
  },
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
