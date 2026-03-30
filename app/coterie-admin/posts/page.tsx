"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { EyeOff, RotateCcw, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";

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
  isHidden: boolean;
  hiddenAt?: string | null;
  author: { id: string; username: string | null; name: string; isSuspended: boolean };
  _count: { comments: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type ModalMode = "hide" | "delete";

export default function AdminPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);

  // 모달 상태
  const [targetPost, setTargetPost] = useState<AdminPost | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("hide");
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [acting, setActing] = useState(false);

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
  }, []); // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPosts(1, pageSize, query);
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps);
    fetchPosts(1, ps, query);
  }

  function goPage(p: number) {
    fetchPosts(p, pageSize, query);
  }

  function openHideModal(post: AdminPost) {
    setTargetPost(post);
    setModalMode("hide");
    setSelectedReason("SPAM");
  }

  function openDeleteModal(post: AdminPost) {
    setTargetPost(post);
    setModalMode("delete");
  }

  async function handleRestore(post: AdminPost) {
    try {
      await axios.put(`/api/admin/posts/${post.id}`, { action: "restore" });
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, isHidden: false, hiddenAt: null } : p
      ));
    } catch {
      alert("복구 실패");
    }
  }

  async function handleConfirm() {
    if (!targetPost) return;
    setActing(true);
    try {
      if (modalMode === "hide") {
        await axios.put(`/api/admin/posts/${targetPost.id}`, { action: "hide", reason: selectedReason });
        setPosts((prev) => prev.map((p) =>
          p.id === targetPost.id ? { ...p, isHidden: true, hiddenAt: new Date().toISOString() } : p
        ));
      } else {
        await axios.delete(`/api/admin/posts/${targetPost.id}`);
        setPosts((prev) => prev.filter((p) => p.id !== targetPost.id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
      setTargetPost(null);
    } catch {
      alert(modalMode === "hide" ? "숨김 처리 실패" : "삭제 실패");
    } finally {
      setActing(false);
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
      ) : posts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>결과 없음</p>
      ) : (
        <div className="xp-window">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="flex items-start gap-2 px-3 py-2.5"
              style={{
                borderBottom: i < posts.length - 1 ? "1px solid var(--border)" : "none",
                background: post.isHidden ? "rgba(0,0,0,0.03)" : undefined,
                opacity: post.isHidden ? 0.75 : 1,
              }}
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {post.isHidden && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded mb-1"
                    style={{ background: "var(--danger)", color: "#fff", fontFamily: "Tahoma, sans-serif" }}
                  >
                    <EyeOff size={9} strokeWidth={1.5} /> hidden
                  </span>
                )}
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

              {/* 액션 버튼 */}
              <div className="flex items-center gap-0.5 shrink-0">
                {!post.isHidden ? (
                  <button
                    onClick={() => openHideModal(post)}
                    title="숨김 처리"
                    className="p-1"
                    style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <EyeOff size={14} strokeWidth={1.5} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleRestore(post)}
                      title="복구"
                      className="p-1"
                      style={{ color: "var(--point)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <RotateCcw size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(post)}
                      title="완전 삭제"
                      className="p-1"
                      style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button className="xp-btn text-xs p-1" onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1}>
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <span className="text-xs" style={{ color: "var(--text-sub)" }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button className="xp-btn text-xs p-1" onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* 모달 */}
      {targetPost && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="xp-window w-full max-w-[320px]">
            <div className="xp-titlebar">
              <span>{modalMode === "hide" ? "게시물 숨김 — 사유 선택" : "게시물 완전 삭제"}</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {modalMode === "hide" ? (
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
              ) : (
                <p className="text-sm" style={{ color: "var(--text-base)" }}>
                  게시물과 이미지를 완전히 삭제합니다.<br />
                  <span style={{ color: "var(--danger)" }}>이 작업은 되돌릴 수 없습니다.</span>
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setTargetPost(null)} className="xp-btn text-xs">취소</button>
                <button
                  onClick={handleConfirm}
                  disabled={acting}
                  className="xp-btn text-xs"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                >
                  {acting ? "처리 중..." : modalMode === "hide" ? "숨김 처리" : "완전 삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
