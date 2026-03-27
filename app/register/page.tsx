"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
// idle: 이메일 입력 대기
// code_sent: 코드 발송됨 (이메일 잠금)
// verified: 인증 완료
type EmailVerifyState = "idle" | "code_sent" | "verified";

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

  // 이메일 인증 상태
  const [emailVerifyState, setEmailVerifyState] = useState<EmailVerifyState>("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "username") {
      setUsernameStatus("idle");
      setUsernameMsg("");
      if (value.length >= 3) checkUsername(value.toLowerCase());
    }
  }

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

  // 인증 코드 발송
  async function handleSendCode() {
    setEmailError(null);
    if (!form.email) {
      setEmailError("이메일을 입력해 주세요.");
      return;
    }
    setSendingCode(true);
    try {
      await axios.post("/api/auth/send-register-code", { email: form.email });
      setEmailVerifyState("code_sent");
      setVerifyCode("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setEmailError(msg ?? "Failed to send code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  }

  // 인증 코드 확인
  async function handleVerifyCode() {
    setEmailError(null);
    if (!verifyCode.trim()) {
      setEmailError("인증 코드를 입력해 주세요.");
      return;
    }
    setVerifying(true);
    try {
      await axios.post("/api/auth/verify-register-code", { email: form.email, code: verifyCode.trim() });
      setEmailVerifyState("verified");
    } catch (err) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      if (data?.expired) {
        // 만료 시 idle로 복귀
        setEmailVerifyState("idle");
        setVerifyCode("");
      }
      setEmailError(data?.error ?? "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  // "이메일을 못 받았나요?" — idle로 복귀
  function handleResetEmail() {
    setEmailVerifyState("idle");
    setVerifyCode("");
    setEmailError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (emailVerifyState !== "verified") {
      setError("이메일 인증을 먼저 완료해 주세요.");
      return;
    }
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
      if (res.data.success) {
        router.push("/login?registered=1");
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Something went wrong.");
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

  const formDisabled = emailVerifyState !== "verified";

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
        <div className="xp-titlebar"><span>coterie — sign up</span></div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* 이메일 인증 섹션 */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs" style={{ color: "var(--text-sub)" }}>Email</label>

              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  className="xp-input flex-1"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  // 코드 발송 후 잠금
                  readOnly={emailVerifyState !== "idle"}
                  style={{
                    opacity: emailVerifyState !== "idle" ? 0.7 : 1,
                    background: emailVerifyState !== "idle" ? "var(--bg-page)" : undefined,
                  }}
                />
                {/* idle: 인증코드 발급 버튼 */}
                {emailVerifyState === "idle" && (
                  <button
                    type="button"
                    className="xp-btn text-xs whitespace-nowrap px-3"
                    onClick={handleSendCode}
                    disabled={sendingCode || !form.email}
                  >
                    {sendingCode ? "발송 중..." : "인증코드 발급"}
                  </button>
                )}
                {/* verified: 인증 완료 표시 */}
                {emailVerifyState === "verified" && (
                  <span
                    className="flex items-center text-xs font-bold px-2 shrink-0"
                    style={{ color: "var(--point)" }}
                  >
                    ✓ 인증됨
                  </span>
                )}
              </div>

              {/* code_sent: 코드 입력창 + 인증 버튼 */}
              {emailVerifyState === "code_sent" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="xp-input flex-1"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="6자리 코드"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      className="xp-btn text-xs whitespace-nowrap px-3"
                      onClick={handleVerifyCode}
                      disabled={verifying || !verifyCode.trim()}
                    >
                      {verifying ? "확인 중..." : "인증"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-left"
                    style={{ color: "var(--text-sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={handleResetEmail}
                  >
                    이메일을 못 받았나요?
                  </button>
                </div>
              )}

              {emailError && (
                <p className="text-[11px]" style={{ color: "var(--danger)" }}>{emailError}</p>
              )}
            </div>

            {/* 나머지 폼 — 이메일 인증 완료 후 활성화 */}
            <div
              className="flex flex-col gap-3"
              style={{ opacity: formDisabled ? 0.4 : 1, pointerEvents: formDisabled ? "none" : "auto", transition: "opacity 0.2s" }}
            >
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                  Name <span style={{ fontWeight: "normal" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="xp-input"
                  value={form.name}
                  onChange={handleChange}
                  tabIndex={formDisabled ? -1 : 0}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                  Username <span style={{ fontWeight: "normal" }}>(used to sign in)</span>
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
                  tabIndex={formDisabled ? -1 : 0}
                />
                {usernameStatus !== "idle" && usernameMsg && (
                  <p className="text-[11px] mt-0.5" style={{ color: usernameColor }}>
                    {usernameStatus === "checking" ? "Checking..." : usernameMsg}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                  Password <span style={{ fontWeight: "normal" }}>(8+ characters)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="xp-input"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  tabIndex={formDisabled ? -1 : 0}
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
                  tabIndex={formDisabled ? -1 : 0}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || formDisabled || usernameStatus === "taken" || usernameStatus === "invalid"}
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
