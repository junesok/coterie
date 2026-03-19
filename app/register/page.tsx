"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// username 유효성 정규식
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    inviteCode: "",
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
      setUsernameMsg("3~20자, 영문 소문자·숫자·언더스코어만 사용 가능");
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await axios.get(`/api/auth/check-username?username=${encodeURIComponent(normalized)}`);
      if (res.data.available) {
        setUsernameStatus("available");
        setUsernameMsg("사용 가능한 유저네임입니다.");
      } else {
        setUsernameStatus("taken");
        setUsernameMsg(res.data.error ?? "이미 사용 중인 유저네임입니다.");
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
      setError("유저네임을 올바르게 입력해 주세요.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("이미 사용 중인 유저네임입니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/register", {
        ...form,
        username: form.username.toLowerCase(),
      });

      // 가입 완료 (이메일 발송 실패 포함) → verify-email 페이지로 이동
      if (res.data.success) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        // 미인증 계정이 있는 경우 → 재발송 페이지로 안내
        if (data?.code === "UNVERIFIED_EMAIL") {
          router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
          return;
        }
        setError(data?.error ?? "오류가 발생했습니다.");
      } else {
        setError("오류가 발생했습니다.");
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
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                유저네임 <span style={{ color: "var(--text-sub)", fontWeight: "normal" }}>(로그인에 사용)</span>
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
                  {usernameStatus === "checking" ? "확인 중..." : usernameMsg}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>이메일 (인증용)</label>
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
              disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid"}
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
