"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, User } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

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
        <button
          className="xp-window w-full text-left"
          onClick={() => router.push("/profile/me/invite")}
        >
          <div className="p-3 flex items-center gap-2">
            <Key size={16} strokeWidth={1.5} style={{ color: "var(--point)" }} />
            <span className="text-sm" style={{ color: "var(--text-base)" }}>내 초대 코드 관리</span>
          </div>
        </button>

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
