"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

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
