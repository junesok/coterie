"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2 } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

interface AdminComment {
  id: string;
  content: string | null;
  createdAt: string;
  author: { id: string; username: string | null; name: string };
  post: { id: string; content: string };
}

export default function AdminComments() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdminComment | null>(null);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    axios.get("/api/admin/comments").then((res) => {
      setComments(res.data.comments);
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/comments/${target.id}`, {
        data: { reason: selectedReason },
      });
      setComments((prev) => prev.filter((c) => c.id !== target.id));
      setTarget(null);
    } catch {
      alert("삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>;

  return (
    <div>
      <h1 className="text-sm font-bold mb-4" style={{ color: "var(--text-base)" }}>
        댓글 관리 ({comments.length}개)
      </h1>
      <div className="flex flex-col gap-2">
        {comments.map((comment) => (
          <div key={comment.id} className="xp-window p-3 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{ color: "var(--text-base)" }}>
                {comment.content ?? "(삭제됨)"}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>
                @{comment.author.username ?? comment.author.name} ·{" "}
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
              </p>
              <p
                className="text-[10px] mt-0.5 truncate"
                style={{ color: "var(--text-sub)", opacity: 0.7 }}
              >
                게시물: {comment.post.content.slice(0, 30)}...
              </p>
            </div>
            <button
              onClick={() => { setTarget(comment); setSelectedReason("SPAM"); }}
              className="p-1"
              style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* 사유 선택 모달 */}
      {target && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="xp-window w-full max-w-[320px]">
            <div className="xp-titlebar"><span>댓글 삭제 — 사유 선택</span></div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={selectedReason === value}
                      onChange={() => setSelectedReason(value)}
                    />
                    <span style={{ color: "var(--text-base)" }}>{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setTarget(null)} className="xp-btn text-xs">취소</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="xp-btn text-xs"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                >
                  {deleting ? "삭제 중..." : "삭제 확정"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
