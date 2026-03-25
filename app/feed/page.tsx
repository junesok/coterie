"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Settings, Globe, Users, Search, X, UserPlus, UserCheck, UserMinus } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";

type Tab = "all" | "friends";
type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

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

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  friendStatus: FriendStatus;
  friendshipId: string | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 검색 모달
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 검색 모달 열기
  function openSearch() {
    setShowSearch(true);
    setQuery("");
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  // 검색어 디바운스
  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/users/search?q=${encodeURIComponent(val)}`);
        if (res.data.success) setSearchResults(res.data.users);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  // 친구 추가 / 취소
  async function handleFriendAction(user: SearchUser) {
    setActionLoadingId(user.id);
    try {
      if (user.friendStatus === "none") {
        const res = await axios.post("/api/friends", { receiverId: user.id });
        if (res.data.success) {
          setSearchResults((prev) => prev.map((u) =>
            u.id === user.id ? { ...u, friendStatus: "pending_sent", friendshipId: res.data.friendship?.id ?? null } : u
          ));
        }
      } else if (user.friendStatus === "pending_sent" && user.friendshipId) {
        await axios.delete(`/api/friends/${user.friendshipId}`);
        setSearchResults((prev) => prev.map((u) =>
          u.id === user.id ? { ...u, friendStatus: "none", friendshipId: null } : u
        ));
      } else if (user.friendStatus === "friends" && user.friendshipId) {
        await axios.delete(`/api/friends/${user.friendshipId}`);
        setSearchResults((prev) => prev.map((u) =>
          u.id === user.id ? { ...u, friendStatus: "none", friendshipId: null } : u
        ));
      }
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  }

  function friendButtonConfig(status: FriendStatus) {
    if (status === "friends") return { icon: <UserMinus size={11} strokeWidth={1.5} />, label: "friends" };
    if (status === "pending_sent") return { icon: <UserMinus size={11} strokeWidth={1.5} />, label: "cancel" };
    if (status === "pending_received") return { icon: <UserCheck size={11} strokeWidth={1.5} />, label: "respond" };
    return { icon: <UserPlus size={11} strokeWidth={1.5} />, label: "add" };
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar
        title="coterie"
        rightSlot={
          <div className="flex items-center gap-0.5">
            <button
              onClick={openSearch}
              className="p-1.5 text-white"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <Search size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="p-1.5 text-white"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <Settings size={16} strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      {/* 탭 */}
      <div
        className="flex gap-1.5 px-3 py-2"
        style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}
      >
        {(["all", "friends"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5"
              style={{
                fontFamily: "Tahoma, sans-serif",
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "var(--text-sub)",
                background: active ? "var(--point)" : "var(--bg-card)",
                border: "1px solid",
                borderColor: active ? "var(--point)" : "var(--border)",
                borderRadius: 999,
                cursor: "pointer",
                boxShadow: active ? "none" : "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)",
              }}
            >
              {t === "all"
                ? <><Globe size={10} strokeWidth={1.5} /> All</>
                : <><Users size={10} strokeWidth={1.5} /> Friends</>
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

      {/* 검색 모달 */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowSearch(false)}
        >
          <div
            className="xp-window w-full max-w-[340px]"
            style={{ maxHeight: "70vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="xp-titlebar">
              <span>find people</span>
              <button
                onClick={() => setShowSearch(false)}
                className="xp-ctrl-btn close"
                style={{ flexShrink: 0 }}
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="px-3 pt-3 pb-2">
              <input
                ref={searchInputRef}
                className="xp-input text-sm w-full"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            {/* 결과 목록 */}
            <div className="overflow-y-auto flex-1">
              {searching ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--text-sub)" }}>Searching...</p>
              ) : query && searchResults.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--text-sub)" }}>No results.</p>
              ) : (
                searchResults.map((user, i) => {
                  const cfg = friendButtonConfig(user.friendStatus);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        onClick={() => { setShowSearch(false); router.push(`/profile/${user.username}`); }}
                      >
                        <Avatar avatarUrl={user.avatarUrl} username={user.username ?? user.name} size={36} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold truncate" style={{ color: "var(--text-base)" }}>
                            {user.name || user.username}
                          </span>
                          {user.username && (
                            <span className="text-xs truncate" style={{ color: "var(--text-sub)" }}>@{user.username}</span>
                          )}
                        </div>
                      </button>

                      {/* 친구 버튼 */}
                      {user.friendStatus !== "pending_received" && (
                        <button
                          onClick={() => handleFriendAction(user)}
                          disabled={actionLoadingId === user.id}
                          className="flex items-center gap-1 text-[11px] shrink-0"
                          style={{
                            background: user.friendStatus === "friends" ? "var(--bg-card)" : "var(--point)",
                            color: user.friendStatus === "friends" ? "var(--text-sub)" : "#fff",
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "2px 8px",
                            cursor: "pointer",
                            fontFamily: "Tahoma, sans-serif",
                          }}
                        >
                          {cfg.icon}
                          {actionLoadingId === user.id ? "..." : cfg.label}
                        </button>
                      )}
                      {user.friendStatus === "pending_received" && (
                        <button
                          onClick={() => { setShowSearch(false); router.push("/notifications"); }}
                          className="text-[11px] shrink-0"
                          style={{
                            background: "var(--bg-card)",
                            color: "var(--text-sub)",
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "2px 8px",
                            cursor: "pointer",
                            fontFamily: "Tahoma, sans-serif",
                          }}
                        >
                          respond
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
