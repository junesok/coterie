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
  createdAt: string;
  invitedBy: { username: string | null; name: string } | null;
  _count: { posts: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/admin/users").then((res) => {
      setUsers(res.data.users);
      setLoading(false);
    });
  }, []);

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

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>;

  return (
    <div>
      <h1 className="text-sm font-bold mb-4" style={{ color: "var(--text-base)" }}>
        유저 관리 ({users.length}명)
      </h1>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
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
              </div>
              {!user.isAdmin && (
                <button
                  onClick={() => handleIssueInvite(user.id)}
                  disabled={issuingId === user.id}
                  className="xp-btn text-xs whitespace-nowrap"
                >
                  {issuingId === user.id ? "발급 중..." : "초대 발급"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
