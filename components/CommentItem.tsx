"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { XpDialog } from "@/components/XpDialog";
import { Avatar } from "@/components/Avatar";
import { MentionText } from "@/components/MentionText";

export interface CommentData {
  id: string;
  content: string | null;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  isReply?: boolean;
  onReplyStart?: (commentId: string) => void;
  onUpdate: () => void;
}

export function CommentItem({ comment, postId, isReply = false, onReplyStart, onUpdate }: CommentItemProps) {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content ?? "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = session?.user?.id === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: enUS });

  async function handleEditSave() {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await axios.put(`/api/comments/${comment.id}`, { content: editContent });
      setEditing(false);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await axios.delete(`/api/comments/${comment.id}`);
      onUpdate();
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className={`${isReply ? "ml-4 pl-3" : ""} py-2`}
      style={isReply ? { borderLeft: "2px solid var(--border)" } : undefined}
    >
      {comment.isDeleted ? (
        // 소프트 삭제된 댓글
        <p className="text-xs italic" style={{ color: "var(--text-sub)" }}>This comment was deleted.</p>
      ) : editing ? (
        // 인라인 편집 모드
        <div className="flex flex-col gap-1">
          <input
            className="xp-input text-sm"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-1">
            <button className="xp-btn text-xs py-0.5" onClick={handleEditSave} disabled={loading}>
              {loading ? "saving..." : "save"}
            </button>
            <button className="xp-btn text-xs py-0.5" onClick={() => setEditing(false)}>cancel</button>
          </div>
        </div>
      ) : (
        // 일반 댓글
        <div>
          <div className="flex items-start justify-between mb-0.5 gap-2">
            <a
              href={comment.author.username ? `/profile/${comment.author.username}` : undefined}
              className="flex items-center gap-1.5 text-xs font-bold min-w-0"
              style={{ color: "var(--text-base)", textDecoration: "none" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                avatarUrl={comment.author.avatarUrl ?? null}
                username={comment.author.username ?? comment.author.name}
                size={20}
              />
              <span className="truncate">
                {comment.author.username ? `@${comment.author.username}` : comment.author.name}
              </span>
            </a>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{timeAgo}</span>
              {comment.isEdited && (
                <span className="text-[10px]" style={{ color: "var(--text-sub)" }}>(edited)</span>
              )}
              {isOwner && (
                <div className="flex gap-0.5 ml-1">
                  <button
                    onClick={() => { setEditContent(comment.content ?? ""); setEditing(true); }}
                    className="p-0.5" style={{ color: "var(--text-sub)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <Pencil size={11} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="p-0.5" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-base)" }}>
            <MentionText text={comment.content ?? ""} />
          </p>

          {/* 답글 달기 버튼 (최상위 댓글에만) */}
          {!isReply && onReplyStart && (
            <button
              onClick={() => onReplyStart(comment.id)}
              className="text-[11px] mt-1"
              style={{ color: "var(--point)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              reply
            </button>
          )}
        </div>
      )}

      {/* 답글 목록 */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          isReply
          onUpdate={onUpdate}
        />
      ))}

      {showDeleteDialog && (
        <XpDialog
          title="Delete comment"
          message="Delete this comment?"
          confirmLabel={loading ? "Deleting..." : "Delete"}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          danger
        />
      )}
    </div>
  );
}
