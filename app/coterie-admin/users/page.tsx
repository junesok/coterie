"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface AdminUser {
  id: string;
  username: string | null;
  email: string;
  name: string;
  isVerified: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  createdAt: string;
  invitedBy: { username: string | null; name: string } | null;
  _count: { posts: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ userId: string; username: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    axios.get("/api/admin/users").then((res) => {
      setUsers(res.data.users);
      setLoading(false);
    });
  }, []);

  async function handleSuspend(userId: string, reason: string) {
    setSuspendingId(userId);
    try {
      await axios.put(`/api/admin/users/${userId}`, { action: "suspend", reason: reason || "OTHER" });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isSuspended: true, suspendedReason: reason } : u));
      setSuspendModal(null);
      setSuspendReason("");
    } catch {
      alert("정지 처리 실패");
    } finally {
      setSuspendingId(null);
    }
  }

  async function handleUnsuspend(userId: string) {
    setSuspendingId(userId);
    try {
      await axios.put(`/api/admin/users/${userId}`, { action: "unsuspend" });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isSuspended: false, suspendedReason: null } : u));
    } catch {
      alert("정지 해제 실패");
    } finally {
      setSuspendingId(null);
    }
  }

  async function handleIssueInvite(userId: string) {
    setIssuingId(userId);
    try {
      const res = await axios.post("/api/admin/invite", { userId, count: 1 });
      alert(`초대 코드 발급 완료: ${res.data.codes[0]?.code}`);
    } catch {
      alert("발급 실패");
    } finally {
      setIssuingId(null);
    }
  }

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase();
        return (
          u.username?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      })
    : users;

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-sm font-bold" style={{ color: "var(--text-base)" }}>
          유저 관리 ({filtered.length}/{users.length}명)
        </h1>
      </div>
      <input
        className="xp-input text-sm w-full mb-3"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div className="flex flex-col gap-2">
        {filtered.map((user) => (
          <div key={user.id} className="xp-window p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-base)" }}>
                  @{user.username ?? "—"} · {user.name}
                  {user.isAdmin && (
                    <span className="ml-1 text-[10px] px-1" style={{ background: "var(--point)", color: "#fff" }}>
                      관리자
                    </span>
                  )}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-sub)" }}>{user.email}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-sub)" }}>
                  가입: {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: ko })}
                  {" · "}게시물 {user._count.posts}개
                  {user.invitedBy && ` · 초대: @${user.invitedBy.username ?? user.invitedBy.name}`}
                </p>
                {!user.isVerified && (
                  <p className="text-[11px]" style={{ color: "var(--danger)" }}>미인증</p>
                )}
                {user.isSuspended && (
                  <p className="text-[11px]" style={{ color: "var(--danger)" }}>
                    정지됨{user.suspendedReason ? ` · ${user.suspendedReason}` : ""}
                  </p>
                )}
              </div>
              {!user.isAdmin && (
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleIssueInvite(user.id)}
                    disabled={issuingId === user.id}
                    className="xp-btn text-xs whitespace-nowrap"
                  >
                    {issuingId === user.id ? "발급 중..." : "초대 발급"}
                  </button>
                  {user.isSuspended ? (
                    <button
                      onClick={() => handleUnsuspend(user.id)}
                      disabled={suspendingId === user.id}
                      className="xp-btn text-xs whitespace-nowrap"
                      style={{ color: "var(--point)" }}
                    >
                      {suspendingId === user.id ? "처리 중..." : "정지 해제"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSuspendModal({ userId: user.id, username: user.username ?? user.name })}
                      disabled={suspendingId === user.id}
                      className="xp-btn text-xs whitespace-nowrap"
                      style={{ color: "var(--danger)" }}
                    >
                      계정 정지
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 계정 정지 사유 입력 모달 */}
      {suspendModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="xp-window w-72">
            <div className="xp-titlebar">
              <span>계정 정지</span>
              <button className="xp-ctrl-btn close" onClick={() => { setSuspendModal(null); setSuspendReason(""); }} />
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-base)" }}>
                @{suspendModal.username} 계정을 정지합니다.
              </p>
              <select
                className="xp-input text-xs"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              >
                <option value="">사유 선택 (선택)</option>
                <option value="SEXUAL_CONTENT">성적 콘텐츠</option>
                <option value="HATE_SPEECH">혐오 발언</option>
                <option value="SPAM">스팸</option>
                <option value="VIOLENCE">폭력</option>
                <option value="PRIVACY_VIOLATION">개인정보 침해</option>
                <option value="OTHER">기타</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button className="xp-btn text-xs" onClick={() => { setSuspendModal(null); setSuspendReason(""); }}>
                  취소
                </button>
                <button
                  className="xp-btn text-xs"
                  style={{ color: "var(--danger)" }}
                  disabled={suspendingId === suspendModal.userId}
                  onClick={() => handleSuspend(suspendModal.userId, suspendReason)}
                >
                  {suspendingId === suspendModal.userId ? "처리 중..." : "정지"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
