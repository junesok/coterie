"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center p-6">
        <div className="xp-window w-full max-w-[340px]">
          <div className="xp-titlebar"><span>reset password</span></div>
          <div className="p-5 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--danger)" }}>Invalid or expired reset link.</p>
            <Link href="/forgot-password" className="xp-btn text-sm">Request new code</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      router.push("/login?reset=1");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Server error."
        : "Server error.";
      if (err && axios.isAxiosError(err) && err.response?.data?.code === "TOKEN_EXPIRED") {
        setError("This link has expired. Please request a new code.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>reset password</span>
          <div className="flex gap-1">
            <div className="xp-ctrl-btn">_</div>
            <div className="xp-ctrl-btn">□</div>
            <div className="xp-ctrl-btn close">✕</div>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>New password</label>
              <input
                type="password"
                className="xp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <PasswordStrengthBar password={password} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-sub)" }}>Confirm password</label>
              <input
                type="password"
                className="xp-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" disabled={loading} className="xp-btn w-full mt-1">
              {loading ? "Saving..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
