"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface AdminComment {
  id: string;
  content: string | null;
  createdAt: string;
  author: { id: string; username: string | null; name: string; isSuspended: boolean };
  post: { id: string; content: string };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminComments() {
  const router = useRouter();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [target, setTarget] = useState<AdminComment | null>(null);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(async (page: number, ps: number, q: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/admin/comments?page=${page}&pageSize=${ps}&q=${encodeURIComponent(q)}`
      );
      if (res.data.success) {
        setComments(res.data.comments);
        setPagination(res.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(1, pageSize, query);
  }, []); // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchComments(1, pageSize, query);
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps);
    fetchComments(1, ps, query);
  }

  function goPage(p: number) {
    fetchComments(p, pageSize, query);
  }

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/comments/${target.id}`, { data: { reason: selectedReason } });
      setComments((prev) => prev.filter((c) => c.id !== target.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      setTarget(null);
    } catch {
      alert("삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-sm font-bold" style={{ color: "var(--text-base)" }}>
          댓글 관리 ({pagination.total}개)
        </h1>
        <select
          className="xp-input text-xs"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          style={{ width: 72 }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}개씩</option>
          ))}
        </select>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input
          className="xp-input text-sm flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="내용 검색..."
          autoComplete="off"
        />
        <button type="submit" className="xp-btn text-xs flex items-center gap-1 shrink-0">
          <Search size={12} strokeWidth={1.5} />
          검색
        </button>
      </form>

      {/* 목록 */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>결과 없음</p>
      ) : (
        <div className="xp-window">
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              className="flex items-start gap-2 px-3 py-2.5"
              style={{ borderBottom: i < comments.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/post/${comment.post.id}`)}
              >
                <p className="text-xs" style={{ color: "var(--text-base)" }}>
                  {comment.content ?? "(삭제됨)"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: comment.author.isSuspended ? "var(--danger)" : "var(--text-sub)" }}>
                  @{comment.author.username ?? comment.author.name}
                  {comment.author.isSuspended && " · 정지됨"}
                  {" · "}
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-sub)", opacity: 0.7 }}>
                  게시물: {comment.post.content ? comment.post.content.slice(0, 40) : "(이미지)"}
                </p>
              </div>
              <button
                onClick={() => { setTarget(comment); setSelectedReason("SPAM"); }}
                className="p-1 shrink-0"
                style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            className="xp-btn text-xs p-1"
            onClick={() => goPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <span className="text-xs" style={{ color: "var(--text-sub)" }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="xp-btn text-xs p-1"
            onClick={() => goPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* 삭제 사유 모달 */}
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
