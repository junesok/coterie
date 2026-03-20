"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서 Sentry 등으로 연결 가능)
    console.error("[Global Error]", error);
  }, [error]);

  return (
    // XP 블루스크린 스타일 — 어두운 파란 배경 + 흰 텍스트
    <div
      className="flex flex-col flex-1 justify-center items-center p-6"
      style={{ background: "#000080", minHeight: "100dvh" }}
    >
      <div className="w-full max-w-[340px] text-white text-center">
        {/* XP BSOD 헤더 */}
        <div
          className="mb-6 px-3 py-1 text-sm font-bold inline-block"
          style={{ background: "#aaaaaa", color: "#000080" }}
        >
          Windows
        </div>

        <p className="text-sm font-bold mb-4">
          something went wrong
        </p>
        <p className="text-xs leading-relaxed mb-6" style={{ color: "#ccccff" }}>
          The server hiccuped.<br />
          Try refreshing or come back in a moment.
        </p>

        <div className="text-xs mb-6" style={{ color: "#8888cc", fontFamily: "monospace" }}>
          {error.digest ? `* Stop: ${error.digest}` : "* An unexpected error occurred."}
        </div>

        <button
          onClick={reset}
          className="text-sm px-4 py-1.5 font-bold"
          style={{
            background: "#aaaaaa",
            color: "#000080",
            border: "2px outset #cccccc",
            cursor: "pointer",
          }}
        >
          refresh
        </button>
      </div>
    </div>
  );
}
