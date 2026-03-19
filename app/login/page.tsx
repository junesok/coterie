"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    "invalid-token": "유효하지 않은 인증 링크입니다.",
    "already-verified": "이미 인증된 계정입니다.",
    "token-expired": "인증 링크가 만료되었습니다. 다시 가입해 주세요.",
    "server-error": "서버 오류가 발생했습니다.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      username: username.toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      {/* XP 창 프레임 */}
      <div className="xp-window w-full max-w-[340px]">
        {/* 타이틀바 */}
        <div className="xp-titlebar">
          <span>coterie</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0">_</div>
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0">□</div>
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0" style={{ background: "#CC0000", color: "#fff" }}>✕</div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5">
          {verified && (
            <div className="mb-4 p-2 border text-sm" style={{ borderColor: "var(--point)", color: "var(--point)" }}>
              이메일 인증 완료! 로그인해 주세요.
            </div>
          )}
          {errorParam && errorMessages[errorParam] && (
            <div className="mb-4 p-2 border text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {errorMessages[errorParam]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>유저네임</label>
              <input
                type="text"
                className="xp-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>비밀번호</label>
              <input
                type="password"
                className="xp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="xp-btn w-full mt-1"
              style={{ color: "var(--text-base)" }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <hr className="xp-hr my-4" />
          <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
            초대 코드가 있으신가요?{" "}
            <Link href="/register" style={{ color: "var(--point)" }}>
              가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
