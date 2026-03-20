"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Mail, AlertTriangle } from "lucide-react";
import axios from "axios";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const emailFailed = searchParams.get("emailFailed") === "1";

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResendMsg(null);
    try {
      await axios.post("/api/auth/resend-verification", { email });
      setResendMsg({ text: "Verification email sent. Please check your inbox.", ok: true });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Failed to resend."
        : "Failed to resend.";
      setResendMsg({ text: msg, ok: false });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>email verification</span>
        </div>
        <div className="p-5 flex flex-col items-center gap-4 text-center">

          {emailFailed ? (
            // 이메일 발송 실패 상태
            <>
              <AlertTriangle size={32} strokeWidth={1.5} style={{ color: "var(--danger)" }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--text-base)" }}>
                  Registration complete
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-sub)" }}>
                  But the verification email failed to send.<br />
                  Try resending below or contact the admin.
                </p>
              </div>
            </>
          ) : (
            // 정상 발송 상태
            <>
              <Mail size={32} strokeWidth={1.5} style={{ color: "var(--point)" }} />
              <div>
                <p className="text-sm mb-1" style={{ color: "var(--text-base)" }}>
                  We sent a verification email to<br />
                  <strong>{email}</strong>.
                </p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                  Check your inbox and click the verification link.<br />
                  The link is valid for 24 hours.
                </p>
              </div>
            </>
          )}

          <hr className="xp-hr w-full" />

          {/* 재발송 */}
          <div className="w-full flex flex-col gap-2">
            {!emailFailed && (
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                Didn&apos;t get it? Check your spam folder too.
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="xp-btn text-xs w-full"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMsg && (
              <p
                className="text-xs"
                style={{ color: resendMsg.ok ? "var(--point)" : "var(--danger)" }}
              >
                {resendMsg.text}
              </p>
            )}
          </div>

          <hr className="xp-hr w-full" />
          <Link href="/login" className="xp-btn text-sm">
            go to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
