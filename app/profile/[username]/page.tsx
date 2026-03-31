"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Camera, UserPlus, UserCheck, UserMinus, UserX, X } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { useProfileData, useFriendRelation, useFriendsList, useAvatarUpload } from "./hooks";
import type { FriendStatus } from "./types";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const isOwn = session?.user?.username === username;

  const { profile, setProfile, isSuspended, posts, loading, loadingMore, hasMore, postCount, friendCount, setFriendCount, loadMore } = useProfileData(username);
  const { friendStatus, friendActionLoading, handleFriendAction } = useFriendRelation(profile, isOwn);
  const { showFriends, setShowFriends, friends, loadingFriends, handleShowFriends } = useFriendsList(username);
  const { uploading, fileInputRef, handleAvatarUpload } = useAvatarUpload(isOwn, setProfile);

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <NavBar title="profile" showBack />
        <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
        <NavBar title="profile" showBack />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
          <div className="xp-window w-full max-w-xs">
            <div className="xp-titlebar"><span>account suspended</span></div>
            <div className="p-4 text-center">
              <p className="text-sm" style={{ color: "var(--text-base)" }}>This account has been suspended.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>@{username}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const joinedAgo = formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: enUS });

  function FriendButton() {
    if (isOwn) return null;
    const configs: Record<FriendStatus, { icon: React.ReactNode; label: string }> = {
      none:             { icon: <UserPlus size={12} strokeWidth={1.5} />,  label: "Add friend" },
      pending_sent:     { icon: <UserX size={12} strokeWidth={1.5} />,    label: "Cancel request" },
      pending_received: { icon: <UserCheck size={12} strokeWidth={1.5} />, label: "Respond" },
      friends:          { icon: <UserMinus size={12} strokeWidth={1.5} />, label: "Friends" },
    };
    const cfg = configs[friendStatus];
    return (
      <button
        onClick={() => handleFriendAction(() => setFriendCount((c) => Math.max(0, c - 1)))}
        disabled={friendActionLoading}
        className="text-[10px] flex items-center gap-1"
        style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.45)", borderRadius: 3, padding: "1px 8px", cursor: "pointer", color: "#fff", fontFamily: "Tahoma, sans-serif" }}
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
          <span className="text-xs font-bold">{profile.username ? `@${profile.username}` : profile.name}</span>
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

          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm" style={{ color: "var(--text-base)" }}>{profile.name}</span>
            {profile.username && <span className="text-xs" style={{ color: "var(--text-sub)" }}>@{profile.username}</span>}
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>joined {joinedAgo}</span>
          </div>
        </div>

        <div className="xp-statusbar">
          <span>{postCount} post{postCount !== 1 ? "s" : ""}</span>
          <button
            onClick={handleShowFriends}
            className="text-xs"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-base)", padding: 0, fontFamily: "Tahoma, sans-serif" }}
          >
            {friendCount} friend{friendCount !== 1 ? "s" : ""}
          </button>
          {isOwn && (
            <button
              onClick={() => router.push("/activity")}
              className="text-xs"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--point)", padding: 0, fontFamily: "Tahoma, sans-serif", marginLeft: "auto" }}
            >
              my activity →
            </button>
          )}
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto py-3">
        {posts.length === 0 ? (
          <p className="text-center text-sm mt-6" style={{ color: "var(--text-sub)" }}>No posts yet.</p>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.id} post={post} showVisibilityBadge={isOwn} />)}
            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore} className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm">
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
              <button onClick={() => setShowFriends(false)} className="xp-ctrl-btn close" style={{ flexShrink: 0 }}>
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingFriends ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--text-sub)" }}>Loading...</p>
              ) : friends.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--text-sub)" }}>No friends yet.</p>
              ) : (
                friends.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => { setShowFriends(false); router.push(`/profile/${f.username}`); }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left"
                    style={{ cursor: "pointer", background: "transparent", border: "none", borderBottom: i < friends.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <Avatar avatarUrl={f.avatarUrl} username={f.username ?? f.name} size={36} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate" style={{ color: "var(--text-base)" }}>{f.name || f.username}</span>
                      {f.username && <span className="text-xs truncate" style={{ color: "var(--text-sub)" }}>@{f.username}</span>}
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
