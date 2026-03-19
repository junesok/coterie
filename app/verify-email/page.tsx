"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Mail } from "lucide-react";
import axios from "axios";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResendMsg(null);
    try {
      await axios.post("/api/auth/resend-verification", { email });
      setResendMsg({ text: "인증 메일을 재발송했습니다. 메일함을 확인해 주세요.", ok: true });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "재발송에 실패했습니다."
        : "재발송에 실패했습니다.";
      setResendMsg({ text: msg, ok: false });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-6">
      <div className="xp-window w-full max-w-[340px]">
        <div className="xp-titlebar">
          <span>이메일 인증</span>
        </div>
        <div className="p-5 flex flex-col items-center gap-4 text-center">
          <Mail size={32} strokeWidth={1.5} style={{ color: "var(--point)" }} />
          <p className="text-sm" style={{ color: "var(--text-base)" }}>
            <strong>{email}</strong>으로<br />
            인증 메일을 발송했습니다.
          </p>
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>
            메일함을 확인하고 인증 링크를 클릭해 주세요.<br />
            링크는 24시간 동안 유효합니다.
          </p>

          <hr className="xp-hr w-full" />

          {/* 재발송 */}
          <div className="w-full flex flex-col gap-2">
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              메일이 오지 않았나요? 스팸함도 확인해 보세요.
            </p>
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="xp-btn text-xs w-full"
            >
              {resending ? "재발송 중..." : "인증 메일 재발송"}
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
            로그인 페이지로
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
