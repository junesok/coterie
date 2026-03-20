"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

// username 유효성 정규식
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    inviteCode: searchParams.get("code") ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMsg, setUsernameMsg] = useState<string>("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // username 필드 변경 시 실시간 확인
    if (name === "username") {
      setUsernameStatus("idle");
      setUsernameMsg("");
      if (value.length >= 3) {
        checkUsername(value.toLowerCase());
      }
    }
  }

  // 디바운스 없이 즉시 확인 (입력 완료 시점)
  const checkUsername = useCallback(async (value: string) => {
    const normalized = value.toLowerCase();

    if (!USERNAME_REGEX.test(normalized)) {
      setUsernameStatus("invalid");
      setUsernameMsg("3–20 chars, lowercase letters, numbers and _ only");
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await axios.get(`/api/auth/check-username?username=${encodeURIComponent(normalized)}`);
      if (res.data.available) {
        setUsernameStatus("available");
        setUsernameMsg("Username is available.");
      } else {
        setUsernameStatus("taken");
        setUsernameMsg(res.data.error ?? "Username is already taken.");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 제출 전 username 최종 검증
    if (!USERNAME_REGEX.test(form.username.toLowerCase())) {
      setError("Please enter a valid username.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Username is already taken.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/register", {
        ...form,
        username: form.username.toLowerCase(),
      });

      // 가입 완료 → 로그인 페이지로 이동
      if (res.data.success) {
        router.push("/login?registered=1");
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        setError(data?.error ?? "Something went wrong.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  const usernameColor =
    usernameStatus === "available" ? "var(--point)" :
    usernameStatus === "taken" || usernameStatus === "invalid" ? "var(--danger)" :
    "var(--text-sub)";

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6 gap-4">

      {/* 사이트 소개 */}
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar"><span>welcome to coterie</span></div>
        <div className="p-4 flex flex-col gap-2.5 text-sm" style={{ color: "var(--text-base)", lineHeight: 1.7 }}>
          <p>hey. i made this.<br />let&apos;s hang out here instead of instagram.</p>
          <hr className="xp-hr" />
          <ul className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-sub)" }}>
            <li>— no feed without logging in.</li>
            <li>— i cannot see your password.</li>
            <li>— i can remove posts that go too far.</li>
            <li style={{ color: "var(--text-base)" }}>— unless it&apos;s funny.</li>
          </ul>
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>come back often. thanks.</p>
        </div>
      </div>

      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>coterie — sign up</span>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Name</label>
              <input
                type="text"
                name="name"
                className="xp-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                Username <span style={{ color: "var(--text-sub)", fontWeight: "normal" }}>(used to sign in)</span>
              </label>
              <input
                type="text"
                name="username"
                className="xp-input"
                value={form.username}
                onChange={handleChange}
                placeholder="your_username"
                required
                autoCapitalize="none"
                autoComplete="username"
              />
              {usernameStatus !== "idle" && usernameMsg && (
                <p className="text-[11px] mt-0.5" style={{ color: usernameColor }}>
                  {usernameStatus === "checking" ? "Checking..." : usernameMsg}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Email</label>
              <input
                type="email"
                name="email"
                className="xp-input"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Password <span style={{ fontWeight: "normal" }}>(8+ characters)</span></label>
              <input
                type="password"
                name="password"
                className="xp-input"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <PasswordStrengthBar password={form.password} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--point)", fontWeight: "bold" }}>
                Invite code
              </label>
              <input
                type="text"
                name="inviteCode"
                className="xp-input"
                style={{ borderColor: "var(--point)" }}
                value={form.inviteCode}
                onChange={handleChange}
                placeholder="COTERIE-XXXXXXXX"
                required
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid"}
              className="xp-btn w-full mt-1"
            >
              {loading ? "Processing..." : "Sign up"}
            </button>
          </form>

          <hr className="xp-hr my-4" />
          <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--point)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
