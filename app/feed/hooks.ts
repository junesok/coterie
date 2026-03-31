"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { Tab, Post, SearchUser } from "./types";

// ── 피드 게시물 목록 ─────────────────────────────────────────────
export function useFeed(tab: Tab) {
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

  return { posts, page, totalPages, loading, loadMore };
}

// ── 유저 검색 + 친구 요청 ────────────────────────────────────────
export function useUserSearch() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openSearch() {
    setShowSearch(true);
    setQuery("");
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

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

  return { showSearch, setShowSearch, query, searchResults, searching, actionLoadingId, searchInputRef, openSearch, handleQueryChange, handleFriendAction, router };
}
