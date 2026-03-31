"use client";

import { use, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Heart, Lock, Flag, Pencil, Trash2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { XpDialog } from "@/components/XpDialog";
import { CommentItem } from "@/components/CommentItem";
import { MentionInput } from "@/components/MentionInput";
import { MentionText } from "@/components/MentionText";
import { usePostDetail, useLike, useCommentSection, usePostReport } from "./hooks";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const { post, setPost, loading, setLoading, fetchPost, showDeleteDialog, setShowDeleteDialog, deleting, handleDeletePost } = usePostDetail(id);
  const { liking, handleLikeToggle } = useLike(id, post, setPost);
  const { comments, fetchComments, commentText, setCommentText, replyToId, submitting, inputRef, submitComment, handleReplyStart, cancelReply } = useCommentSection(id);
  const { reportModal, setReportModal, reportReason, setReportReason, reporting, reportMsg, setReportMsg, handleReport } = usePostReport(id);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPost, fetchComments, setLoading]);

  const isOwner = session?.user?.id === post?.author.id;
  const replyTargetAuthor = replyToId ? comments.find((c) => c.id === replyToId)?.author : null;
  const replyTarget = replyTargetAuthor
    ? (replyTargetAuthor.username ? `@${replyTargetAuthor.username}` : replyTargetAuthor.name)
    : null;

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    await submitComment();
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg-card)" }}>
      <NavBar title="post" showBack />

      {loading ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--text-sub)" }}>Loading...</p>
      ) : !post ? (
        <p className="text-center mt-8 text-sm" style={{ color: "var(--danger)" }}>Post not found.</p>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-20">
            <ImageCarousel images={post.images} enableLightbox />

            <div className="p-4">
              {/* 작성자 행 */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <a
                  href={post.author.username ? `/profile/${post.author.username}` : "#"}
                  className="flex items-center gap-2 min-w-0"
                  style={{ textDecoration: "none" }}
                >
                  <Avatar avatarUrl={post.author.avatarUrl ?? null} username={post.author.username ?? post.author.name} size={28} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate" style={{ color: "var(--point)" }}>
                      {post.author.username ? `@${post.author.username}` : post.author.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}
                      </span>
                      {post.visibility === "FRIENDS" && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5" style={{ background: "var(--point)", color: "#fff", borderRadius: 4, lineHeight: 1 }}>
                          <Lock size={8} strokeWidth={2.5} />
                          friends
                        </span>
                      )}
                    </div>
                  </div>
                </a>

                {isOwner ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/post/${id}/edit`)}
                      className="flex items-center gap-1 text-xs"
                      style={{ background: "var(--bg-button)", border: "1px solid var(--border)", boxShadow: "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "var(--text-base)", fontFamily: "Tahoma, sans-serif" }}
                    >
                      <Pencil size={11} strokeWidth={1.5} />
                      edit
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="flex items-center gap-1 text-xs"
                      style={{ background: "var(--bg-button)", border: "1px solid var(--border)", boxShadow: "inset 1px 1px #fff, inset -1px -1px var(--shadow-lo)", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "var(--danger)", fontFamily: "Tahoma, sans-serif" }}
                    >
                      <Trash2 size={11} strokeWidth={1.5} />
                      delete
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReportModal(true); setReportReason(""); setReportMsg(null); }}
                    className="flex items-center gap-1 text-xs"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: "3px 4px", fontFamily: "Tahoma, sans-serif" }}
                  >
                    <Flag size={11} strokeWidth={1.5} />
                    report
                  </button>
                )}
              </div>

              <p className="text-sm" style={{ color: "var(--text-base)" }}>
                <MentionText text={post.content} />
              </p>

              {/* 좋아요 */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleLikeToggle}
                  disabled={liking}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ background: "none", border: "none", cursor: "pointer", color: post.isLiked ? "var(--danger)" : "var(--text-sub)", padding: 0 }}
                >
                  <Heart size={15} strokeWidth={1.5} fill={post.isLiked ? "var(--danger)" : "none"} />
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
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-sub)" }}>Be the first to comment.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <CommentItem comment={comment} postId={id} onReplyStart={handleReplyStart} onUpdate={fetchComments} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 댓글 입력 */}
          <form
            onSubmit={handleSubmitComment}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-10"
            style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {replyTarget && (
              <div className="flex items-center justify-between px-3 py-1" style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--point)" }}>Reply to {replyTarget}</span>
                <button type="button" onClick={cancelReply} className="text-xs" style={{ color: "var(--text-sub)", background: "none", border: "none", cursor: "pointer" }}>
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
              <button type="submit" className="xp-btn text-sm px-3" disabled={submitting || !commentText.trim()} style={{ color: "var(--point)", fontWeight: "bold" }}>
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

      {reportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="xp-window w-72">
            <div className="xp-titlebar">
              <span>report post</span>
              <button className="xp-ctrl-btn close" onClick={() => setReportModal(false)} />
            </div>
            <div className="p-4 flex flex-col gap-3">
              {reportMsg ? (
                <>
                  <p className="text-xs" style={{ color: "var(--text-base)" }}>{reportMsg}</p>
                  <button className="xp-btn text-xs self-end" onClick={() => setReportModal(false)}>close</button>
                </>
              ) : (
                <>
                  <select className="xp-input text-xs" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                    <option value="">select a reason</option>
                    <option value="SEXUAL_CONTENT">sexual content</option>
                    <option value="HATE_SPEECH">hate speech</option>
                    <option value="SPAM">spam</option>
                    <option value="VIOLENCE">violence</option>
                    <option value="PRIVACY_VIOLATION">privacy violation</option>
                    <option value="OTHER">other</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button className="xp-btn text-xs" onClick={() => setReportModal(false)}>cancel</button>
                    <button className="xp-btn text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} disabled={!reportReason || reporting} onClick={handleReport}>
                      {reporting ? "submitting..." : "submit report"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
