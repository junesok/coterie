"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import axios from "axios";
import { NavBar, EditDeleteButtons } from "@/components/NavBar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { XpDialog } from "@/components/XpDialog";
import { CommentItem, type CommentData } from "@/components/CommentItem";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
  images: { url: string; order: number }[];
  _count: { comments: number };
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

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
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

  function handleReplyStart(commentId: string) {
    setReplyToId(commentId);
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyToId(null);
    setCommentText("");
  }

  const isOwner = session?.user?.id === post?.author.id;
  const replyTarget = replyToId
    ? comments.find((c) => c.id === replyToId)?.author.name
    : null;

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-card)" }}>
      <NavBar
        title="게시물"
        showBack
        rightSlot={
          isOwner && post ? (
            <EditDeleteButtons
              onEdit={() => router.push(`/post/${id}/edit`)}
              onDelete={() => setShowDeleteDialog(true)}
            />
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
      ) : !post ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--danger)" }}>게시물을 찾을 수 없습니다.</p>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto pb-20">
            {/* 이미지 캐러셀 */}
            <ImageCarousel images={post.images} />

            {/* 본문 */}
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: "var(--text-sub)" }}>
                {post.author.name} ·{" "}
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-base)" }}>
                {post.content}
              </p>
            </div>

            <hr className="xp-hr" />

            {/* 댓글 목록 */}
            <div className="px-4 pt-2">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-sub)" }}>
                댓글 {comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)}개
              </p>
              {comments.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-sub)" }}>
                  첫 댓글을 남겨보세요.
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

          {/* 하단 고정 댓글 입력창 */}
          <form
            onSubmit={handleSubmitComment}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-10"
            style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
          >
            {replyTarget && (
              <div className="flex items-center justify-between px-3 py-1" style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--point)" }}>
                  {replyTarget}에게 답글
                </span>
                <button type="button" onClick={cancelReply} className="text-xs" style={{ color: "var(--text-sub)", background: "none", border: "none", cursor: "pointer" }}>취소</button>
              </div>
            )}
            <div className="flex gap-2 p-2">
              <input
                ref={inputRef}
                className="xp-input flex-1 text-sm"
                placeholder={replyTarget ? `${replyTarget}에게 답글...` : "댓글을 입력하세요..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                className="xp-btn text-sm px-3"
                disabled={submitting || !commentText.trim()}
                style={{ color: "var(--point)", fontWeight: "bold" }}
              >
                {submitting ? "..." : "전송"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteDialog && (
        <XpDialog
          title="게시물 삭제"
          message="게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmLabel={deleting ? "삭제 중..." : "삭제"}
          onConfirm={handleDeletePost}
          onCancel={() => setShowDeleteDialog(false)}
          danger
        />
      )}
    </div>
  );
}
