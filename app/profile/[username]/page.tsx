"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { Camera, UserPlus, UserCheck, UserMinus, UserX, X } from "lucide-react";
import imageCompression from "browser-image-compression";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount?: number;
  friendCount?: number;
}

interface Post {
  id: string;
  content: string;
  visibility?: string;
  createdAt: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount?: number;
}

interface Friend {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  // 친구 관계 상태
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // 친구 목록 모달
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwn = session?.user?.username === username;

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
      .catch(() => router.push("/feed"))
      .finally(() => setLoading(false));
  }, [username, router]);

  // 친구 상태 조회 (타인 프로필만)
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

  async function handleFriendAction() {
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
      } else if (friendStatus === "friends" && friendshipId) {
        await axios.delete(`/api/friends/${friendshipId}`);
        setFriendStatus("none");
        setFriendshipId(null);
        setFriendCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    } finally {
      setFriendActionLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <NavBar title="profile" showBack />
        <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  const joinedAgo = formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: enUS });

  // 친구 버튼 렌더
  function FriendButton() {
    if (isOwn) return null;
    const configs = {
      none:            { icon: <UserPlus size={12} strokeWidth={1.5} />, label: "Add friend",     color: "var(--point)" },
      pending_sent:    { icon: <UserX size={12} strokeWidth={1.5} />,   label: "Cancel request", color: "var(--text-sub)" },
      pending_received:{ icon: <UserCheck size={12} strokeWidth={1.5} />,label: "Respond",        color: "var(--point)" },
      friends:         { icon: <UserMinus size={12} strokeWidth={1.5} />,label: "Friends",        color: "var(--text-sub)" },
    };
    const cfg = configs[friendStatus];
    return (
      <button
        onClick={friendStatus === "pending_received" ? () => router.push("/notifications") : handleFriendAction}
        disabled={friendActionLoading}
        className="text-[10px] flex items-center gap-1"
        style={{
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.45)",
          borderRadius: 3,
          padding: "1px 8px",
          cursor: "pointer",
          color: "#fff",
          fontFamily: "Tahoma, sans-serif",
        }}
      >
        {cfg.icon}
        {friendActionLoading ? "..." : cfg.label}
      </button>
    );
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar title="profile" showBack />

      {/* 프로필 헤더 */}
      <div className="xp-window mx-2 mt-3">
        <div className="xp-titlebar py-1 px-2.5">
          <span className="text-xs font-bold">
            {profile.username ? `@${profile.username}` : profile.name}
          </span>
          <div className="flex items-center gap-1.5">
            <FriendButton />
            {isOwn && (
              <button
                className="text-[10px] text-white/80"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.45)", borderRadius: 3, padding: "1px 8px", cursor: "pointer" }}
                onClick={() => router.push("/profile/edit")}
              >
                edit
              </button>
            )}
          </div>
        </div>

        <div className="p-4 flex items-center gap-4">
          {/* 아바타 */}
          <div className="relative">
            <Avatar avatarUrl={profile.avatarUrl} username={profile.username ?? profile.name} size={64} />
            {isOwn && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex items-center justify-center"
                  style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-button)", border: "1px solid var(--border)", boxShadow: "inset 1px 1px #fff, inset -1px -1px #848284", cursor: "pointer" }}
                >
                  <Camera size={11} strokeWidth={1.5} style={{ color: "var(--text-base)" }} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                <span className="text-[9px] text-white">...</span>
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm" style={{ color: "var(--text-base)" }}>{profile.name}</span>
            {profile.username && (
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>@{profile.username}</span>
            )}
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>joined {joinedAgo}</span>
          </div>
        </div>

        {/* 상태바 */}
        <div className="xp-statusbar">
          <span>{postCount} post{postCount !== 1 ? "s" : ""}</span>
          <button
            onClick={handleShowFriends}
            className="text-xs"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-base)", padding: 0, fontFamily: "Tahoma, sans-serif" }}
          >
            {friendCount} friend{friendCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto py-3">
        {posts.length === 0 ? (
          <p className="text-center text-sm mt-6" style={{ color: "var(--text-sub)" }}>No posts yet.</p>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showVisibilityBadge={isOwn} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>

      {/* 친구 목록 모달 */}
      {showFriends && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowFriends(false)}
        >
          <div
            className="xp-window w-full max-w-[340px]"
            style={{ maxHeight: "65vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="xp-titlebar">
              <span>friends · {friendCount}</span>
              {/* Luna XP 닫기 버튼 */}
              <button
                onClick={() => setShowFriends(false)}
                className="xp-ctrl-btn close"
                style={{ flexShrink: 0 }}
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
              {loadingFriends ? (
                <p className="text-xs text-center mt-4" style={{ color: "var(--text-sub)" }}>Loading...</p>
              ) : friends.length === 0 ? (
                <p className="text-xs text-center mt-4" style={{ color: "var(--text-sub)" }}>No friends yet.</p>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setShowFriends(false); router.push(`/profile/${f.username}`); }}
                    className="flex items-center gap-3 p-2 xp-window text-left"
                    style={{ cursor: "pointer", width: "100%" }}
                  >
                    <Avatar avatarUrl={f.avatarUrl} username={f.username ?? f.name} size={36} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate" style={{ color: "var(--text-base)" }}>{f.name || f.username}</span>
                      {f.username && (
                        <span className="text-xs truncate" style={{ color: "var(--text-sub)" }}>@{f.username}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
