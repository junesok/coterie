"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AccountRecoveryPage() {
  const { update } = useSession();
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover() {
    setRecovering(true);
    setError(null);
    try {
      await axios.post("/api/users/me/recover");
      // Clear pendingRecovery from session so proxy lets them through
      await update({ pendingRecovery: false });
      router.replace("/feed");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong.";
      setError(msg);
    } finally {
      setRecovering(false);
    }
  }

  async function handleLeave() {
    await signOut({ redirect: false });
    router.replace("/login");
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: "var(--bg-page)" }}>
      <div className="xp-window w-full max-w-sm">
        <div className="xp-titlebar">
          <span>account recovery</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--text-base)", lineHeight: 1.7 }}>
            Your account is scheduled for deletion.
            <br />
            Would you like to recover it?
          </p>
          <p className="text-xs" style={{ color: "var(--text-sub)", lineHeight: 1.6 }}>
            If you recover now, your account and all data will be fully restored. If you do nothing, your account will be permanently deleted after 30 days.
          </p>
          {error && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button className="xp-btn text-sm" onClick={handleLeave}>
              no, sign out
            </button>
            <button
              className="xp-btn text-sm"
              style={{ color: "var(--point)", borderColor: "var(--point)" }}
              onClick={handleRecover}
              disabled={recovering}
            >
              {recovering ? "recovering..." : "recover my account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
