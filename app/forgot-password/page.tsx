"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

type Step = "email" | "code";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email: email.toLowerCase() });
      setStep("code");
    } catch {
      setError("Failed to send email. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-code", {
        email: email.toLowerCase(),
        code: code.trim(),
      });
      router.push(`/reset-password?token=${res.data.token}`);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Invalid code."
        : "Server error.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>forgot password</span>
          <div className="flex gap-1">
            <div className="xp-ctrl-btn">_</div>
            <div className="xp-ctrl-btn">□</div>
            <div className="xp-ctrl-btn close">✕</div>
          </div>
        </div>

        <div className="p-5">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                Enter your email address and we&apos;ll send you a verification code.
              </p>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Email</label>
                <input
                  type="email"
                  className="xp-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
              <button type="submit" disabled={loading} className="xp-btn w-full mt-1">
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                We sent a 6-digit code to <strong>{email}</strong>.
                <br />The code expires in 10 minutes.
              </p>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Verification code</label>
                <input
                  type="text"
                  className="xp-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
              <button type="submit" disabled={loading} className="xp-btn w-full mt-1">
                {loading ? "Verifying..." : "Verify code"}
              </button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: "var(--point)", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => { setStep("email"); setError(null); setCode(""); }}
              >
                Resend code
              </button>
            </form>
          )}

          <hr className="xp-hr my-4" />
          <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "var(--point)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
