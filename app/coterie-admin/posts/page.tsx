"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface AdminPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string | null; name: string; isSuspended: boolean };
  _count: { comments: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [targetPost, setTargetPost] = useState<AdminPost | null>(null);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPosts = useCallback(async (page: number, ps: number, q: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/admin/posts?page=${page}&pageSize=${ps}&q=${encodeURIComponent(q)}`
      );
      if (res.data.success) {
        setPosts(res.data.posts);
        setPagination(res.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, pageSize, query);
  }, []);  // eslint-disable-line

  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPosts(1, pageSize, val), 350);
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps);
    fetchPosts(1, ps, query);
  }

  function goPage(p: number) {
    fetchPosts(p, pageSize, query);
  }

  async function handleDelete() {
    if (!targetPost) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/posts/${targetPost.id}`, { data: { reason: selectedReason } });
      setPosts((prev) => prev.filter((p) => p.id !== targetPost.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      setTargetPost(null);
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
          게시물 관리 ({pagination.total}개)
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
      <input
        className="xp-input text-sm w-full mb-3"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="내용 검색..."
        autoComplete="off"
      />

      {/* 목록 */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>결과 없음</p>
      ) : (
        <div className="xp-window">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="flex items-start gap-2 px-3 py-2.5"
              style={{ borderBottom: i < posts.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                <p
                  className="text-xs"
                  style={{
                    color: "var(--text-base)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.content || "(이미지 게시물)"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: post.author.isSuspended ? "var(--danger)" : "var(--text-sub)" }}>
                  @{post.author.username ?? post.author.name}
                  {post.author.isSuspended && " · 정지됨"}
                  {" · "}
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
                  {" · "}댓글 {post._count.comments}
                </p>
              </div>
              <button
                onClick={() => { setTargetPost(post); setSelectedReason("SPAM"); }}
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
      {targetPost && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="xp-window w-full max-w-[320px]">
            <div className="xp-titlebar"><span>게시물 삭제 — 사유 선택</span></div>
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
                <button onClick={() => setTargetPost(null)} className="xp-btn text-xs">취소</button>
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
