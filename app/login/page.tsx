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
  const registered = searchParams.get("registered");
  const errorParam = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    "invalid-token": "Invalid verification link.",
    "already-verified": "This account is already verified.",
    "token-expired": "Verification link has expired. Please sign up again.",
    "server-error": "A server error occurred.",
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
        </div>

        {/* 콘텐츠 */}
        <div className="p-5">
          {registered && (
            <div className="mb-4 p-2 border text-sm" style={{ borderColor: "var(--point)", color: "var(--point)" }}>
              Account created! Please sign in.
            </div>
          )}
          {verified && (
            <div className="mb-4 p-2 border text-sm" style={{ borderColor: "var(--point)", color: "var(--point)" }}>
              Email verified! Please sign in.
            </div>
          )}
          {errorParam && errorMessages[errorParam] && (
            <div className="mb-4 p-2 border text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {errorMessages[errorParam]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Username</label>
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
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Password</label>
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <hr className="xp-hr my-4" />
          <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
            Have an invite code?{" "}
            <Link href="/register" style={{ color: "var(--point)" }}>
              Sign up
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
