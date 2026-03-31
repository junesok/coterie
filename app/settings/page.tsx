"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, Copy } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

interface InviteCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy: { name: string; username: string | null } | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // 계정 탈퇴
  const [showWithdrawSection, setShowWithdrawSection] = useState(false);
  const [withdrawPw, setWithdrawPw] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAllCodes, setShowAllCodes] = useState(false);

  const CODES_DEFAULT = 3;

  useEffect(() => {
    axios.get("/api/invite/my-codes")
      .then((res) => { if (res.data.success) setCodes(res.data.codes); })
      .finally(() => setCodesLoading(false));
  }, []);

  function handleCopy(code: string) {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPwMsg(null);
    try {
      await axios.put("/api/users/me", { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ text: "Password updated.", ok: true });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong.";
      setPwMsg({ text: msg, ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMsg(null);
    try {
      await axios.post("/api/users/me/delete", { password: withdrawPw });
      // Trigger session update so pendingRecovery is set on next login
      await signOut({ redirect: false });
      router.push("/login");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong.";
      setWithdrawMsg({ text: msg, ok: false });
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <NavBar title="settings" showBack />

      <div className="p-4 flex flex-col gap-4">

        {/* 테마 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>theme</span></div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-base)" }}>light / dark mode</span>
            <ThemeToggle />
          </div>
        </div>

        {/* 초대 코드 */}
        <div className="xp-window">
          <div className="xp-titlebar">
            <div className="flex items-center gap-1.5">
              <Key size={12} strokeWidth={1.5} />
              <span>my invite codes</span>
            </div>
          </div>
          <div className="flex flex-col">
            {codesLoading ? (
              <p className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>Loading...</p>
            ) : codes.length === 0 ? (
              <p className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>No invite codes yet.</p>
            ) : (
              <>
                {(showAllCodes ? codes : codes.slice(0, CODES_DEFAULT)).map((code, i) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                      opacity: code.isUsed ? 0.5 : 1,
                      background: "var(--bg-card)",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-xs font-mono tracking-wider"
                        style={{ color: code.isUsed ? "var(--text-sub)" : "var(--text-base)" }}
                      >
                        {code.code}
                      </span>
                      {code.isUsed && code.usedBy && (
                        <span className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                          used by {code.usedBy.name || code.usedBy.username || "unknown"}
                        </span>
                      )}
                      {!code.isUsed && (
                        <span className="text-[10px]" style={{ color: "var(--point)" }}>unused</span>
                      )}
                    </div>
                    <button
                      className="xp-btn flex items-center gap-1 text-xs py-0.5 px-2"
                      onClick={() => handleCopy(code.code)}
                      disabled={code.isUsed}
                    >
                      <Copy size={11} strokeWidth={1.5} />
                      {copied === code.code ? "copied!" : "copy link"}
                    </button>
                  </div>
                ))}
                {codes.length > CODES_DEFAULT && (
                  <button
                    className="xp-btn text-xs w-full"
                    style={{ borderTop: "1px solid var(--border)", borderRadius: 0 }}
                    onClick={() => setShowAllCodes((v) => !v)}
                  >
                    {showAllCodes ? `show less` : `load more (${codes.length - CODES_DEFAULT} more)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>change password</span></div>
          <form onSubmit={handlePasswordChange} className="p-3 flex flex-col gap-2">
            <input
              type="password"
              className="xp-input text-sm"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="current password"
              autoComplete="current-password"
            />
            <input
              type="password"
              className="xp-input text-sm"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="new password (8+ characters)"
              minLength={8}
              autoComplete="new-password"
            />
            <PasswordStrengthBar password={newPw} />
            {pwMsg && (
              <p className="text-xs" style={{ color: pwMsg.ok ? "var(--point)" : "var(--danger)" }}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" className="xp-btn text-sm self-end" disabled={loading}>
              update
            </button>
          </form>
        </div>

        {/* 계정 탈퇴 */}
        <div className="xp-window">
          <div className="xp-titlebar">
            <span>delete account</span>
            <button
              className="xp-ctrl-btn"
              onClick={() => { setShowWithdrawSection((v) => !v); setWithdrawMsg(null); setWithdrawPw(""); }}
            />
          </div>
          {showWithdrawSection && (
            <form onSubmit={handleWithdraw} className="p-3 flex flex-col gap-2">
              <p className="text-xs" style={{ color: "var(--text-sub)", lineHeight: 1.6 }}>
                Your account will be scheduled for deletion. You have <strong style={{ color: "var(--text-base)" }}>30 days</strong> to recover it by signing in again. After 30 days, all data is permanently deleted.
              </p>
              <input
                type="password"
                className="xp-input text-sm"
                value={withdrawPw}
                onChange={(e) => setWithdrawPw(e.target.value)}
                placeholder="confirm with your password"
                autoComplete="current-password"
              />
              {withdrawMsg && (
                <p className="text-xs" style={{ color: withdrawMsg.ok ? "var(--point)" : "var(--danger)" }}>
                  {withdrawMsg.text}
                </p>
              )}
              <button
                type="submit"
                className="xp-btn text-sm self-end"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                disabled={withdrawing || !withdrawPw}
              >
                {withdrawing ? "processing..." : "delete my account"}
              </button>
            </form>
          )}
        </div>

        {/* 로그아웃 */}
        <button
          className="xp-btn w-full text-sm mt-2"
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          onClick={handleSignOut}
        >
          sign out
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
          {session?.user?.email}
        </p>

        {/* 사이트 소개 */}
        <div className="xp-window mt-2">
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
      </div>
    </div>
  );
}
