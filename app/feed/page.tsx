"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Settings, Globe, Users } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";

type Tab = "all" | "friends";

interface Post {
  id: string;
  content: string;
  visibility: string;
  createdAt: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount?: number;
}

export default function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (p: number, t: Tab) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/posts?page=${p}&tab=${t}`);
      if (res.data.success) {
        setPosts((prev) => (p === 1 ? res.data.posts : [...prev, ...res.data.posts]));
        setTotalPages(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, tab);
  }, [tab, fetchPosts]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, tab);
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar
        title="coterie"
        rightSlot={
          <button
            onClick={() => router.push("/settings")}
            className="p-1.5 text-white"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        }
      />

      {/* 탭 */}
      <div
        className="flex gap-1 px-3 pt-2 pb-1"
        style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}
      >
        {(["all", "friends"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1 text-xs px-3 py-1"
              style={{
                fontFamily: "Tahoma, sans-serif",
                fontWeight: active ? 700 : 400,
                color: active ? "var(--point)" : "var(--text-sub)",
                background: active ? "var(--bg-card)" : "transparent",
                border: active ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 3,
                cursor: "pointer",
                boxShadow: active ? "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)" : "none",
              }}
            >
              {t === "all"
                ? <><Globe size={11} strokeWidth={1.5} /> All</>
                : <><Users size={11} strokeWidth={1.5} /> Friends</>
              }
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {loading && posts.length === 0 ? (
          <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
            {tab === "friends" ? "No posts from friends yet." : "No posts yet."}
          </p>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>

      <button
        onClick={() => router.push("/post/new")}
        className="xp-btn fixed flex items-center gap-1.5 text-sm px-4 py-2 z-10"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          right: "calc(max(0px, (100vw - 390px) / 2) + 16px)",
          boxShadow: "inset 1px 1px var(--shadow-hi), inset -1px -1px var(--shadow-lo), 2px 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <PenLine size={16} strokeWidth={1.5} />
        New post
      </button>
    </div>
  );
}
