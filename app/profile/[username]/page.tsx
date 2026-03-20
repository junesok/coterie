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
import { Camera } from "lucide-react";
import imageCompression from "browser-image-compression";

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; username?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount?: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwn = session?.user?.username === username;

  useEffect(() => {
    axios
      .get(`/api/users/${username}`)
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.user);
          setPosts(res.data.posts);
        } else {
          router.push("/feed");
        }
      })
      .catch(() => router.push("/feed"))
      .finally(() => setLoading(false));
  }, [username, router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isOwn) return;

    setUploading(true);
    try {
      // 압축
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      // 서명 취득
      const signRes = await axios.post("/api/upload/sign");
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      // Cloudinary 직접 업로드
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("folder", folder);
      fd.append("timestamp", timestamp);
      fd.append("api_key", apiKey);
      fd.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      const uploadData = await uploadRes.json();

      if (!uploadData.secure_url) throw new Error("Upload failed");

      // 프로필 업데이트
      await axios.put("/api/users/me", { avatarUrl: uploadData.secure_url });
      setProfile((prev) => prev ? { ...prev, avatarUrl: uploadData.secure_url } : prev);
    } catch (err) {
      console.error("Avatar upload failed", err);
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

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar title="profile" showBack />

      {/* 프로필 헤더 */}
      <div className="xp-window mx-2 mt-3">
        <div className="xp-titlebar py-1 px-2.5">
          <span className="text-xs font-bold">
            {profile.username ? `@${profile.username}` : profile.name}
          </span>
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
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "var(--bg-button)",
                    border: "1px solid var(--border)",
                    boxShadow: "inset 1px 1px #fff, inset -1px -1px #848284",
                    cursor: "pointer",
                  }}
                  title="Change photo"
                >
                  <Camera size={11} strokeWidth={1.5} style={{ color: "var(--text-base)" }} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.4)" }}>
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
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>
              joined {joinedAgo}
            </span>
          </div>
        </div>

        {/* 상태바 */}
        <div className="xp-statusbar">
          <span>{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto py-3">
        {posts.length === 0 ? (
          <p className="text-center text-sm mt-6" style={{ color: "var(--text-sub)" }}>
            No posts yet.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
