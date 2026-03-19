"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { XpDialog } from "@/components/XpDialog";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

interface AdminPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string | null; name: string };
  _count: { comments: number };
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetPost, setTargetPost] = useState<AdminPost | null>(null);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const res = await axios.get("/api/admin/posts");
    setPosts(res.data.posts);
    setLoading(false);
  }

  async function handleDelete() {
    if (!targetPost) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/posts/${targetPost.id}`, {
        data: { reason: selectedReason },
      });
      setPosts((prev) => prev.filter((p) => p.id !== targetPost.id));
      setTargetPost(null);
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
        게시물 관리 ({posts.length}개)
      </h1>
      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <div key={post.id} className="xp-window p-3 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs mb-1"
                style={{
                  color: "var(--text-base)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {post.content}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>
                @{post.author.username ?? post.author.name} ·{" "}
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })} ·{" "}
                댓글 {post._count.comments}
              </p>
            </div>
            <button
              onClick={() => { setTargetPost(post); setSelectedReason("SPAM"); }}
              className="p-1"
              style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* 삭제 사유 선택 모달 */}
      {targetPost && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="xp-window w-full max-w-[320px]">
            <div className="xp-titlebar"><span>게시물 삭제 — 사유 선택</span></div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                삭제 사유를 선택해 주세요.
              </p>
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
                <button
                  onClick={() => setTargetPost(null)}
                  className="xp-btn text-xs"
                >
                  취소
                </button>
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
