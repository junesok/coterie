"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>오류 — 페이지 없음</span>
          <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0" style={{ background: "#CC0000", color: "#fff" }}>✕</div>
        </div>
        <div className="p-5 flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">🔍</div>
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--text-base)" }}>
              여긴 아무것도 없어요
            </p>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              찾으시는 페이지가 없거나 삭제된 것 같아요.
            </p>
          </div>
          <Link href="/feed" className="xp-btn text-sm px-4">
            피드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
