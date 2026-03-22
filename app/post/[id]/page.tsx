"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Heart, Lock } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { Pencil, Trash2 } from "lucide-react";
import { ImageCarousel } from "@/components/ImageCarousel";
import { XpDialog } from "@/components/XpDialog";
import { CommentItem, type CommentData } from "@/components/CommentItem";
import { MentionInput } from "@/components/MentionInput";
import { MentionText } from "@/components/MentionText";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  visibility: "PUBLIC" | "FRIENDS";
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount: number;
  isLiked: boolean;
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);

  // 댓글 입력
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPost = useCallback(async () => {
    const res = await axios.get(`/api/posts/${id}`);
    if (res.data.success) setPost(res.data.post);
  }, [id]);

  const fetchComments = useCallback(async () => {
    const res = await axios.get(`/api/posts/${id}/comments`);
    if (res.data.success) setComments(res.data.comments);
  }, [id]);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPost, fetchComments]);

  async function handleDeletePost() {
    setDeleting(true);
    try {
      await axios.delete(`/api/posts/${id}`);
      router.push("/feed");
      router.refresh();
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  async function submitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/posts/${id}/comments`, {
        content: commentText.trim(),
        parentId: replyToId,
      });
      setCommentText("");
      setReplyToId(null);
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    await submitComment();
  }

  async function handleLikeToggle() {
    if (!post || liking) return;
    setLiking(true);
    try {
      if (post.isLiked) {
        const res = await axios.delete(`/api/posts/${id}/like`);
        setPost((prev) =>
          prev ? { ...prev, isLiked: false, likeCount: res.data.likeCount } : prev
        );
      } else {
        const res = await axios.post(`/api/posts/${id}/like`);
        setPost((prev) =>
          prev ? { ...prev, isLiked: true, likeCount: res.data.likeCount } : prev
        );
      }
    } catch {
      // 에러 무시 (이미 좋아요 등)
    } finally {
      setLiking(false);
    }
  }

  function handleReplyStart(commentId: string) {
    setReplyToId(commentId);
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyToId(null);
    setCommentText("");
  }

  const isOwner = session?.user?.id === post?.author.id;
  const replyTargetAuthor = replyToId ? comments.find((c) => c.id === replyToId)?.author : null;
  const replyTarget = replyTargetAuthor
    ? (replyTargetAuthor.username ? `@${replyTargetAuthor.username}` : replyTargetAuthor.name)
    : null;

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-card)" }}>
      <NavBar title="post" showBack />

      {loading ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--text-sub)" }}>Loading...</p>
      ) : !post ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--danger)" }}>Post not found.</p>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto pb-20">
            {/* 이미지 캐러셀 */}
            <ImageCarousel images={post.images} />

            {/* 본문 */}
            <div className="p-4">
              {/* 작성자 행 + edit/delete */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <a
                  href={post.author.username ? `/profile/${post.author.username}` : "#"}
                  className="flex items-center gap-2 min-w-0"
                  style={{ textDecoration: "none" }}
                >
                  <Avatar
                    avatarUrl={post.author.avatarUrl ?? null}
                    username={post.author.username ?? post.author.name}
                    size={28}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate" style={{ color: "var(--point)" }}>
                      {post.author.username ? `@${post.author.username}` : post.author.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}
                      </span>
                      {post.visibility === "FRIENDS" && (
                        <span
                          className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5"
                          style={{
                            background: "var(--point)",
                            color: "#fff",
                            borderRadius: 4,
                            lineHeight: 1,
                          }}
                        >
                          <Lock size={8} strokeWidth={2.5} />
                          friends
                        </span>
                      )}
                    </div>
                  </div>
                </a>
                {isOwner && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/post/${id}/edit`)}
                      className="flex items-center gap-1 text-xs"
                      style={{
                        background: "var(--bg-button)",
                        border: "1px solid var(--border)",
                        boxShadow: "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)",
                        borderRadius: 3,
                        padding: "3px 8px",
                        cursor: "pointer",
                        color: "var(--text-base)",
                        fontFamily: "Tahoma, sans-serif",
                      }}
                    >
                      <Pencil size={11} strokeWidth={1.5} />
                      edit
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="flex items-center gap-1 text-xs"
                      style={{
                        background: "var(--bg-button)",
                        border: "1px solid var(--border)",
                        boxShadow: "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)",
                        borderRadius: 3,
                        padding: "3px 8px",
                        cursor: "pointer",
                        color: "var(--danger)",
                        fontFamily: "Tahoma, sans-serif",
                      }}
                    >
                      <Trash2 size={11} strokeWidth={1.5} />
                      delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--text-base)" }}>
                <MentionText text={post.content} />
              </p>

              {/* 좋아요 버튼 */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleLikeToggle}
                  disabled={liking}
                  className="flex items-center gap-1.5 text-xs"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: post.isLiked ? "var(--danger)" : "var(--text-sub)",
                    padding: 0,
                  }}
                >
                  <Heart
                    size={15}
                    strokeWidth={1.5}
                    fill={post.isLiked ? "var(--danger)" : "none"}
                  />
                  <span>{post.likeCount > 0 ? post.likeCount : ""}</span>
                </button>
              </div>
            </div>

            <hr className="xp-hr" />

            {/* 댓글 목록 */}
            <div className="px-4 pt-2">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-sub)" }}>
                {comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)} comments
              </p>
              {comments.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-sub)" }}>
                  Be the first to comment.
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <CommentItem
                      comment={comment}
                      postId={id}
                      onReplyStart={handleReplyStart}
                      onUpdate={fetchComments}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 하단 고정 댓글 입력창 — 홈 바 회피 */}
          <form
            onSubmit={handleSubmitComment}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-10"
            style={{
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {replyTarget && (
              <div
                className="flex items-center justify-between px-3 py-1"
                style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-xs" style={{ color: "var(--point)" }}>
                  Reply to {replyTarget}
                </span>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-xs"
                  style={{ color: "var(--text-sub)", background: "none", border: "none", cursor: "pointer" }}
                >
                  cancel
                </button>
              </div>
            )}
            <div className="flex gap-2 p-2">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder={replyTarget ? `Reply to ${replyTarget}...` : "Write a comment..."}
                inputRef={inputRef}
                onSubmit={submitComment}
              />
              <button
                type="submit"
                className="xp-btn text-sm px-3"
                disabled={submitting || !commentText.trim()}
                style={{ color: "var(--point)", fontWeight: "bold" }}
              >
                {submitting ? "..." : "send"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteDialog && (
        <XpDialog
          title="Delete post"
          message="Delete this post? This cannot be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onConfirm={handleDeletePost}
          onCancel={() => setShowDeleteDialog(false)}
          danger
        />
      )}
    </div>
  );
}
