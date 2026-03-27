"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Heart, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Avatar } from "@/components/Avatar";
import { MentionText } from "@/components/MentionText";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    visibility?: string;
    createdAt: string | Date;
    author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
    images: { url: string; order: number }[];
    _count: { comments: number };
    likeCount?: number;
  };
  showVisibilityBadge?: boolean;
}

export function PostCard({ post, showVisibilityBadge = false }: PostCardProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  const authorLabel = post.author.username
    ? `@${post.author.username}`
    : post.author.name;

  return (
    <div
      className="block mb-2 mx-2"
      onClick={() => router.push(`/post/${post.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="xp-window transition-all hover:brightness-95">
        {/* XP 타이틀바 — 작성자(클릭 시 프로필) + 작성 시간 */}
        <div className="xp-titlebar py-1 px-2.5 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              if (post.author.username) router.push(`/profile/${post.author.username}`);
            }}
            style={{ cursor: "pointer" }}
          >
            <Avatar
              avatarUrl={post.author.avatarUrl ?? null}
              username={post.author.username ?? post.author.name}
              size={22}
            />
            <span
              className="text-xs font-bold text-white truncate"
              style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {authorLabel}
            </span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {showVisibilityBadge && post.visibility === "FRIENDS" && (
              <Lock size={10} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.7)" }} />
            )}
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>
              {timeAgo}
            </span>
          </div>
        </div>

        {/* 썸네일 이미지 */}
        {post.images.length > 0 && (
          <div className="relative" style={{ borderBottom: "1px solid var(--border)", height: 144 }}>
            <Image
              src={post.images[0].url}
              alt="게시물 이미지"
              fill
              sizes="(max-width: 390px) 100vw, 390px"
              style={{ objectFit: "cover" }}
              priority={false}
            />
            {post.images.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  fontSize: 11,
                  fontFamily: "Tahoma, sans-serif",
                  borderRadius: 10,
                  padding: "2px 8px",
                  lineHeight: "16px",
                  letterSpacing: "0.02em",
                  pointerEvents: "none",
                }}
              >
                1 / {post.images.length}
              </div>
            )}
          </div>
        )}

        {/* 본문 미리보기 */}
        <div className="px-3 py-2.5" style={{ background: "var(--bg-card)" }}>
          <p
            className="text-sm"
            style={{
              color: "var(--text-base)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.5",
            }}
          >
            <MentionText text={post.content} />
          </p>
        </div>

        {/* XP 상태바 — 좋아요 + 댓글 수 */}
        <div className="xp-statusbar justify-end">
          {(post.likeCount ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <Heart size={10} strokeWidth={1.5} />
              {post.likeCount}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <MessageSquare size={10} strokeWidth={1.5} />
            {post._count.comments}
          </span>
        </div>
      </div>
    </div>
  );
}
