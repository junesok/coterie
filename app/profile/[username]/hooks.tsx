"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import imageCompression from "browser-image-compression";
import type { UserProfile, Post, Friend, FriendStatus } from "./types";

// ── 프로필 데이터 + 게시물 목록 ──────────────────────────────────
export function useProfileData(username: string) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/users/${username}`)
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.user);
          setPosts(res.data.posts);
          setHasMore(res.data.hasMore);
          setNextCursor(res.data.nextCursor);
          setPostCount(res.data.user.postCount ?? res.data.posts.length);
          setFriendCount(res.data.user.friendCount ?? 0);
        } else {
          router.push("/feed");
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.data?.isSuspended) {
          setIsSuspended(true);
        } else {
          router.push("/feed");
        }
      })
      .finally(() => setLoading(false));
  }, [username, router]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get(`/api/users/${username}?cursor=${nextCursor}`);
      if (res.data.success) {
        setPosts((prev) => [...prev, ...res.data.posts]);
        setHasMore(res.data.hasMore);
        setNextCursor(res.data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return { profile, setProfile, isSuspended, posts, loading, loadingMore, hasMore, postCount, friendCount, setFriendCount, loadMore };
}

// ── 친구 관계 ─────────────────────────────────────────────────────
export function useFriendRelation(profile: UserProfile | null, isOwn: boolean) {
  const router = useRouter();
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  useEffect(() => {
    if (isOwn || !profile) return;
    axios
      .get(`/api/friends/status?targetId=${profile.id}`)
      .then((res) => {
        if (res.data.success) {
          setFriendStatus(res.data.status);
          setFriendshipId(res.data.friendshipId ?? null);
        }
      })
      .catch(() => {});
  }, [isOwn, profile]);

  async function handleFriendAction(onUnfriend: () => void) {
    if (!profile) return;
    setFriendActionLoading(true);
    try {
      if (friendStatus === "none") {
        const res = await axios.post("/api/friends", { receiverId: profile.id });
        setFriendStatus("pending_sent");
        setFriendshipId(res.data.friendship.id);
      } else if (friendStatus === "pending_sent" && friendshipId) {
        await axios.delete(`/api/friends/${friendshipId}`);
        setFriendStatus("none");
        setFriendshipId(null);
      } else if (friendStatus === "pending_received") {
        router.push("/notifications");
      } else if (friendStatus === "friends" && friendshipId) {
        await axios.delete(`/api/friends/${friendshipId}`);
        setFriendStatus("none");
        setFriendshipId(null);
        onUnfriend();
      }
    } catch {
      // ignore
    } finally {
      setFriendActionLoading(false);
    }
  }

  return { friendStatus, friendshipId, friendActionLoading, handleFriendAction };
}

// ── 친구 목록 모달 ───────────────────────────────────────────────
export function useFriendsList(username: string) {
  const router = useRouter();
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  async function handleShowFriends() {
    setShowFriends(true);
    if (friends.length > 0) return;
    setLoadingFriends(true);
    try {
      const res = await axios.get(`/api/users/${username}/friends`);
      if (res.data.success) setFriends(res.data.friends);
    } finally {
      setLoadingFriends(false);
    }
  }

  return { showFriends, setShowFriends, friends, loadingFriends, handleShowFriends, router };
}

// ── 아바타 업로드 ────────────────────────────────────────────────
export function useAvatarUpload(isOwn: boolean, setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isOwn) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 400, useWebWorker: true });
      const signRes = await axios.post("/api/upload/sign");
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("folder", folder);
      fd.append("timestamp", timestamp);
      fd.append("api_key", apiKey);
      fd.append("signature", signature);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Upload failed");
      await axios.put("/api/users/me", { avatarUrl: uploadData.secure_url });
      setProfile((prev) => prev ? { ...prev, avatarUrl: uploadData.secure_url } : prev);
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return { uploading, fileInputRef, handleAvatarUpload };
}
