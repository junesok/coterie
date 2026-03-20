"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, User, Copy } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      setNameMsg({ text: "이름이 변경되었습니다.", ok: true });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "오류가 발생했습니다.";
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
      setPwMsg({ text: "비밀번호가 변경되었습니다.", ok: true });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "오류가 발생했습니다.";
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
      <NavBar title="설정" showBack />

      <div className="p-4 flex flex-col gap-4">

        {/* 테마 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>테마</span></div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-base)" }}>라이트 / 다크 모드</span>
            <ThemeToggle />
          </div>
        </div>

        {/* 초대 코드 */}
        <div className="xp-window">
          <div className="xp-titlebar">
            <div className="flex items-center gap-1.5">
              <Key size={12} strokeWidth={1.5} />
              <span>내 초대 코드</span>
            </div>
          </div>
          <div className="flex flex-col">
            {codesLoading ? (
              <p className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
            ) : codes.length === 0 ? (
              <p className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>발급된 초대 코드가 없습니다.</p>
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
                        사용됨 — {code.usedBy.name}
                      </span>
                    )}
                    {!code.isUsed && (
                      <span className="text-[10px]" style={{ color: "var(--point)" }}>미사용</span>
                    )}
                  </div>
                  <button
                    className="xp-btn flex items-center gap-1 text-xs py-0.5 px-2"
                    onClick={() => handleCopy(code.code)}
                    disabled={code.isUsed}
                  >
                    <Copy size={11} strokeWidth={1.5} />
                    {copied === code.code ? "복사됨!" : "링크 복사"}
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
              <span>이름 변경</span>
            </div>
          </div>
          <form onSubmit={handleNameChange} className="p-3 flex flex-col gap-2">
            <input
              className="xp-input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새 이름"
            />
            {nameMsg && (
              <p className="text-xs" style={{ color: nameMsg.ok ? "var(--point)" : "var(--danger)" }}>
                {nameMsg.text}
              </p>
            )}
            <button type="submit" className="xp-btn text-sm self-end" disabled={loading}>
              저장
            </button>
          </form>
        </div>

        {/* 비밀번호 변경 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>비밀번호 변경</span></div>
          <form onSubmit={handlePasswordChange} className="p-3 flex flex-col gap-2">
            <input
              type="password"
              className="xp-input text-sm"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
            />
            <input
              type="password"
              className="xp-input text-sm"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              minLength={8}
              autoComplete="new-password"
            />
            {pwMsg && (
              <p className="text-xs" style={{ color: pwMsg.ok ? "var(--point)" : "var(--danger)" }}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" className="xp-btn text-sm self-end" disabled={loading}>
              변경
            </button>
          </form>
        </div>

        {/* 로그아웃 */}
        <button
          className="xp-btn w-full text-sm mt-2"
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          onClick={handleSignOut}
        >
          로그아웃
        </button>

        <p className="text-xs text-center mt-2" style={{ color: "var(--text-sub)" }}>
          {session?.user?.email}
        </p>
      </div>
    </div>
  );
}
