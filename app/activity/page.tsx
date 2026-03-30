"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";

type Tab = "likes" | "comments";

type LikeItem = {
  id: string;
  post: {
    id: string;
    content: string;
    visibility: string;
    createdAt: string;
    author: { id: string; username: string | null; name: string; avatarUrl: string | null };
    images: { url: string; order: number }[];
    _count: { likes: number; comments: number };
  };
};

type CommentItem = {
  id: string;
  content: string | null;
  createdAt: string;
  post: {
    id: string;
    content: string;
    author: { username: string | null; avatarUrl: string | null };
    images?: { url: string; order: number }[];
  };
};

const LIMIT_LIKES = 15;
const LIMIT_COMMENTS = 20;

export default function ActivityPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("likes");

  // 좋아요 탭 상태
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [likesCursor, setLikesCursor] = useState<string | null>(null);
  const [likesHasMore, setLikesHasMore] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);

  // 댓글 탭 상태
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchLikes = useCallback(async (cursor?: string) => {
    setLikesLoading(true);
    try {
      const params: Record<string, string | number> = { limit: LIMIT_LIKES };
      if (cursor) params.cursor = cursor;
      const res = await axios.get("/api/users/me/likes", { params });
      const { likes: newLikes, nextCursor } = res.data;
      setLikes((prev) => (cursor ? [...prev, ...newLikes] : newLikes));
      setLikesCursor(nextCursor);
      setLikesHasMore(!!nextCursor);
    } catch {
      // silent
    } finally {
      setLikesLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (cursor?: string) => {
    setCommentsLoading(true);
    try {
      const params: Record<string, string | number> = { limit: LIMIT_COMMENTS };
      if (cursor) params.cursor = cursor;
      const res = await axios.get("/api/users/me/comments", { params });
      const { comments: newComments, nextCursor } = res.data;
      setComments((prev) => (cursor ? [...prev, ...newComments] : newComments));
      setCommentsCursor(nextCursor);
      setCommentsHasMore(!!nextCursor);
    } catch {
      // silent
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // 탭 전환 시 초기화
  useEffect(() => {
    if (tab === "likes") {
      setLikes([]);
      setLikesCursor(null);
      setLikesHasMore(false);
      fetchLikes();
    } else {
      setComments([]);
      setCommentsCursor(null);
      setCommentsHasMore(false);
      fetchComments();
    }
  }, [tab, fetchLikes, fetchComments]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "likes", label: "Liked", icon: <Heart size={10} strokeWidth={1.5} /> },
    { key: "comments", label: "Comments", icon: <MessageCircle size={10} strokeWidth={1.5} /> },
  ];

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar title="my activity" showBack />

      {/* 탭 */}
      <div
        className="flex gap-1.5 px-3 py-2"
        style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
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
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto py-3">

        {/* ── 좋아요 탭 ── */}
        {tab === "likes" && (
          <>
            {likesLoading && likes.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
            ) : likes.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>No liked posts yet.</p>
            ) : (
              <>
                {likes.map((item) => (
                  <PostCard
                    key={item.id}
                    post={{ ...item.post, likeCount: item.post._count.likes }}
                    showVisibilityBadge
                  />
                ))}
                {likesHasMore && (
                  <button
                    onClick={() => fetchLikes(likesCursor ?? undefined)}
                    disabled={likesLoading}
                    className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm"
                  >
                    {likesLoading ? "Loading..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── 댓글 탭 ── */}
        {tab === "comments" && (
          <>
            {commentsLoading && comments.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>No comments yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-0 mx-2">
                  {comments.map((item, i) => (
                    <CommentRow
                      key={item.id}
                      item={item}
                      isFirst={i === 0}
                      isLast={i === comments.length - 1 && !commentsHasMore}
                      onClick={() => router.push(`/post/${item.post.id}`)}
                    />
                  ))}
                </div>
                {commentsHasMore && (
                  <button
                    onClick={() => fetchComments(commentsCursor ?? undefined)}
                    disabled={commentsLoading}
                    className="xp-btn w-[calc(100%-24px)] mx-3 my-2 text-sm"
                  >
                    {commentsLoading ? "Loading..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommentRow({
  item,
  isFirst,
  isLast,
  onClick,
}: {
  item: CommentItem;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  const postPreview = item.post.content?.slice(0, 60) ?? "";
  const thumb = item.post.images?.[0]?.url ?? null;

  const borderRadius = isFirst && isLast
    ? "3px"
    : isFirst
      ? "3px 3px 0 0"
      : isLast
        ? "0 0 3px 3px"
        : "0";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderBottom: isLast ? "1px solid var(--border)" : "none",
        borderRadius,
        cursor: "pointer",
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        boxShadow: isFirst ? "inset 0 1px #fff" : undefined,
        userSelect: "none",
      }}
    >
      {/* 왼쪽: 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: "8px 10px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* 게시물 작성자 + 미리보기 */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          <Avatar
            avatarUrl={item.post.author.avatarUrl}
            username={item.post.author.username ?? ""}
            size={14}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-base)",
              fontFamily: "Tahoma, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            @{item.post.author.username}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-sub)",
              fontFamily: "Tahoma, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            · {postPreview}
          </span>
        </div>

        {/* 내 댓글 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            paddingLeft: 4,
            borderLeft: "2px solid var(--point)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--text-base)",
              fontFamily: "Tahoma, sans-serif",
              lineHeight: 1.4,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {item.content}
          </p>
        </div>

        {/* 날짜 */}
        <span
          style={{
            fontSize: 10,
            color: "var(--text-sub)",
            fontFamily: "Tahoma, sans-serif",
          }}
        >
          {timeAgo}
        </span>
      </div>

      {/* 오른쪽: 이미지 썸네일 (있을 때만) */}
      {thumb && (
        <div
          style={{
            width: 56,
            flexShrink: 0,
            position: "relative",
            borderLeft: "1px solid var(--border)",
            overflow: "hidden",
            borderRadius: isFirst && isLast
              ? "0 3px 3px 0"
              : isFirst
                ? "0 3px 0 0"
                : isLast
                  ? "0 0 3px 0"
                  : "0",
          }}
        >
          <Image
            src={thumb}
            alt="post image"
            fill
            sizes="56px"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
    </div>
  );
}
