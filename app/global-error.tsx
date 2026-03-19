"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// 루트 레이아웃 바깥 에러 (최후 방어선)
// global-error는 자체 <html>/<body>를 포함해야 함
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: "#000080",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          fontFamily: "sans-serif",
          color: "#ffffff",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 340 }}>
          <div
            style={{
              display: "inline-block",
              background: "#aaaaaa",
              color: "#000080",
              padding: "2px 12px",
              marginBottom: 24,
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            Windows
          </div>
          <p style={{ fontSize: 14, fontWeight: "bold", marginBottom: 16 }}>
            잠깐 졸고 있었어요
          </p>
          <p style={{ fontSize: 12, color: "#ccccff", lineHeight: 1.7, marginBottom: 24 }}>
            서버가 잠깐 졸았나봐요.<br />
            새로고침 하거나 조금 뒤에 다시 시도해 주세요.
          </p>
          <button
            onClick={reset}
            style={{
              fontSize: 13,
              padding: "6px 20px",
              background: "#aaaaaa",
              color: "#000080",
              border: "2px outset #cccccc",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            새로고침
          </button>
        </div>
      </body>
    </html>
  );
}
