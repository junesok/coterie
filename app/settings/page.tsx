"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, User, Copy } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

interface InviteCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy: { name: string } | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

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

  async function handleNameChange(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setNameMsg(null);
    try {
      await axios.put("/api/users/me", { name });
      setNameMsg({ text: "Name updated.", ok: true });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong.";
      setNameMsg({ text: msg, ok: false });
    } finally {
      setLoading(false);
    }
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
              codes.map((code, i) => (
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
                        used by {code.usedBy.name}
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
              ))
            )}
          </div>
        </div>

        {/* 이름 변경 */}
        <div className="xp-window">
          <div className="xp-titlebar">
            <div className="flex items-center gap-1.5">
              <User size={12} strokeWidth={1.5} />
              <span>change name</span>
            </div>
          </div>
          <form onSubmit={handleNameChange} className="p-3 flex flex-col gap-2">
            <input
              className="xp-input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new name"
            />
            {nameMsg && (
              <p className="text-xs" style={{ color: nameMsg.ok ? "var(--point)" : "var(--danger)" }}>
                {nameMsg.text}
              </p>
            )}
            <button type="submit" className="xp-btn text-sm self-end" disabled={loading}>
              save
            </button>
          </form>
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
