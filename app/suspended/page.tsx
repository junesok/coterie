"use client";

import { signOut } from "next-auth/react";

export default function SuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ background: "var(--bg-page)" }}>
      <div className="xp-window w-full max-w-sm">
        <div className="xp-titlebar">
          <span>account suspended</span>
        </div>
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <p className="text-sm" style={{ color: "var(--text-base)" }}>
            Your account has been suspended by an administrator.
          </p>
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>
            If you believe this is a mistake, please contact support.
          </p>
          <button
            className="xp-btn text-xs px-4 py-1"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            sign out
          </button>
        </div>
      </div>
    </div>
  );
}
