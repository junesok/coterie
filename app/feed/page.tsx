"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Settings } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
  images: { url: string; order: number }[];
  _count: { comments: number };
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/posts?page=${p}`);
      if (res.data.success) {
        setPosts((prev) => (p === 1 ? res.data.posts : [...prev, ...res.data.posts]));
        setTotalPages(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar
        title="coterie"
        rightSlot={
          <button
            onClick={() => router.push("/settings")}
            className="p-1 text-white"
            style={{ background: "transparent", border: "none" }}
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto py-3">
        {loading && posts.length === 0 ? (
          <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
            불러오는 중...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
            아직 게시물이 없습니다.
          </p>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm"
              >
                {loading ? "불러오는 중..." : "더 보기"}
              </button>
            )}
          </>
        )}
      </div>

      {/* 새 글 작성 버튼 (우하단 고정) */}
      <button
        onClick={() => router.push("/post/new")}
        className="xp-btn fixed bottom-6 right-1/2 translate-x-[130px] flex items-center gap-1.5 text-sm px-4 py-2 z-10"
        style={{ boxShadow: "inset 1px 1px var(--shadow-hi), inset -1px -1px var(--shadow-lo), 2px 2px 4px rgba(0,0,0,0.3)" }}
      >
        <PenLine size={16} strokeWidth={1.5} />
        새 글
      </button>
    </div>
  );
}
