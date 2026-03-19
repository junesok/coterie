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

  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="xp-window mb-2 mx-3 cursor-pointer hover:opacity-90 transition-opacity">
        {/* 썸네일 이미지 */}
        {post.images.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.images[0].url}
            alt="게시물 이미지"
            className="w-full h-40 object-cover"
            style={{ borderBottom: "1px solid var(--border)" }}
          />
        )}

        <div className="p-3">
          {/* 본문 미리보기 2줄 */}
          <p
            className="text-sm mb-2"
            style={{
              color: "var(--text-base)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.content}
          </p>

          {/* 작성자 + 시간 + 댓글 수 + 좋아요 수 */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>
              {post.author.username ? `@${post.author.username}` : post.author.name} · {timeAgo}
            </span>
            <div className="flex items-center gap-2">
              {(post.likeCount ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                  <Heart size={11} strokeWidth={1.5} />
                  {post.likeCount}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-sub)" }}>
                <MessageSquare size={12} strokeWidth={1.5} />
                {post._count.comments}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
