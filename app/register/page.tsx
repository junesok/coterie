"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post("/api/auth/register", form);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "오류가 발생했습니다.");
      } else {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>coterie — 가입</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0">_</div>
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0">□</div>
            <div className="w-4 h-4 xp-btn text-[10px] flex items-center justify-center p-0" style={{ background: "#CC0000", color: "#fff" }}>✕</div>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>이름</label>
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
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>이메일</label>
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
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>비밀번호 (8자 이상)</label>
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
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--point)", fontWeight: "bold" }}>
                초대 코드
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
              disabled={loading}
              className="xp-btn w-full mt-1"
            >
              {loading ? "처리 중..." : "가입하기"}
            </button>
          </form>

          <hr className="xp-hr my-4" />
          <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" style={{ color: "var(--point)" }}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
