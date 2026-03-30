"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
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

  // 좋아요 목록 조회
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
      // 조용히 처리
    } finally {
      setLikesLoading(false);
    }
  }, []);

  // 댓글 목록 조회
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
      // 조용히 처리
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // 탭 전환 시 초기화 후 로딩
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
    { key: "likes", label: "좋아요", icon: <Heart size={10} strokeWidth={1.5} /> },
    { key: "comments", label: "댓글", icon: <MessageCircle size={10} strokeWidth={1.5} /> },
  ];

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-page)" }}>
      <NavBar title="내 활동" showBack />

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
        {tab === "likes" && (
          <>
            {likesLoading && likes.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
                Loading...
              </p>
            ) : likes.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
                아직 좋아요한 게시물이 없어요.
              </p>
            ) : (
              <>
                {likes.map((item) => (
                  <PostCard
                    key={item.id}
                    post={{
                      ...item.post,
                      likeCount: item.post._count.likes,
                    }}
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

        {tab === "comments" && (
          <>
            {commentsLoading && comments.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
                Loading...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: "var(--text-sub)" }}>
                아직 작성한 댓글이 없어요.
              </p>
            ) : (
              <>
                {comments.map((item) => (
                  <CommentCard
                    key={item.id}
                    item={item}
                    onClick={() => router.push(`/post/${item.post.id}`)}
                  />
                ))}
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

function CommentCard({
  item,
  onClick,
}: {
  item: CommentItem;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  const postPreview = item.post.content?.slice(0, 80) ?? "";

  return (
    <div
      onClick={onClick}
      className="xp-window mx-2 mb-2 cursor-pointer"
      style={{ userSelect: "none" }}
    >
      <div className="p-3 flex flex-col gap-1.5">
        {/* 게시물 작성자 + 미리보기 */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar
            avatarUrl={item.post.author.avatarUrl}
            username={item.post.author.username ?? ""}
            size={16}
          />
          <span
            className="text-[11px] font-bold shrink-0"
            style={{ color: "var(--text-base)" }}
          >
            @{item.post.author.username}
          </span>
          <span
            className="text-[11px] truncate"
            style={{ color: "var(--text-sub)" }}
          >
            · {postPreview}
          </span>
        </div>

        {/* 내 댓글 내용 */}
        <div className="flex items-end justify-between gap-2">
          <p
            className="text-xs leading-snug"
            style={{ color: "var(--text-base)" }}
          >
            └ {item.content}
          </p>
          <span
            className="text-[10px] shrink-0"
            style={{ color: "var(--text-sub)" }}
          >
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}
