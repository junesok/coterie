"use client";

import Link from "next/link";
import { MessageSquare, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string | Date;
    author: { id: string; name: string; username?: string | null };
    images: { url: string; order: number }[];
    _count: { comments: number };
    likeCount?: number;
  };
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const authorLabel = post.author.username
    ? `@${post.author.username}`
    : post.author.name;

  return (
    <Link href={`/post/${post.id}`} className="block mb-2 mx-2">
      <div className="xp-window transition-all hover:brightness-95">
        {/* XP 타이틀바 — 작성자 + 작성 시간 */}
        <div className="xp-titlebar py-1 px-2.5">
          <span className="text-xs font-bold text-white truncate">{authorLabel}</span>
          <span className="text-[10px] ml-2 shrink-0" style={{ color: "rgba(255,255,255,0.8)" }}>
            {timeAgo}
          </span>
        </div>

        {/* 썸네일 이미지 */}
        {post.images.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.images[0].url}
            alt="게시물 이미지"
            className="w-full h-36 object-cover"
            style={{ borderBottom: "1px solid var(--border)" }}
          />
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
            {post.content}
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
    </Link>
  );
}
