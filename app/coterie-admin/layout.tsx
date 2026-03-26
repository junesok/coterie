import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ReactNode } from "react";

// 관리자 레이아웃 — 비관리자 접근 차단
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/feed");
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* 관리자 상단 타이틀바 */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ background: "var(--point)", color: "#fff" }}
      >
        <span className="text-sm font-bold">coterie admin</span>
      </div>

      {/* 관리자 네비게이션 */}
      <nav
        className="flex gap-1 px-3 py-2 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        {[
          { href: "/coterie-admin/dashboard", label: "대시보드" },
          { href: "/coterie-admin/users", label: "유저" },
          { href: "/coterie-admin/posts", label: "게시물" },
          { href: "/coterie-admin/comments", label: "댓글" },
          { href: "/coterie-admin/logs", label: "조치 기록" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="xp-btn text-xs px-3">
            {label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
