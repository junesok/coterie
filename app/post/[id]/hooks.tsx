"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { Post } from "./types";
import type { CommentData } from "@/components/CommentItem";

// ── 게시물 fetch + 삭제 ──────────────────────────────────────────
export function usePostDetail(id: string) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPost = useCallback(async () => {
    const res = await axios.get(`/api/posts/${id}`);
    if (res.data.success) setPost(res.data.post);
  }, [id]);

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

  return { post, setPost, loading, setLoading, fetchPost, showDeleteDialog, setShowDeleteDialog, deleting, handleDeletePost };
}

// ── 좋아요 토글 ──────────────────────────────────────────────────
export function useLike(id: string, post: Post | null, setPost: React.Dispatch<React.SetStateAction<Post | null>>) {
  const [liking, setLiking] = useState(false);

  async function handleLikeToggle() {
    if (!post || liking) return;
    setLiking(true);
    try {
      if (post.isLiked) {
        const res = await axios.delete(`/api/posts/${id}/like`);
        setPost((prev) => prev ? { ...prev, isLiked: false, likeCount: res.data.likeCount } : prev);
      } else {
        const res = await axios.post(`/api/posts/${id}/like`);
        setPost((prev) => prev ? { ...prev, isLiked: true, likeCount: res.data.likeCount } : prev);
      }
    } catch {
      // 에러 무시 (이미 좋아요 등)
    } finally {
      setLiking(false);
    }
  }

  return { liking, handleLikeToggle };
}

// ── 댓글 목록 + 입력 ─────────────────────────────────────────────
export function useCommentSection(id: string) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    const res = await axios.get(`/api/posts/${id}/comments`);
    if (res.data.success) setComments(res.data.comments);
  }, [id]);

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

  function handleReplyStart(commentId: string) {
    setReplyToId(commentId);
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyToId(null);
    setCommentText("");
  }

  return { comments, fetchComments, commentText, setCommentText, replyToId, setReplyToId, submitting, inputRef, submitComment, handleReplyStart, cancelReply };
}

// ── 신고 ─────────────────────────────────────────────────────────
export function usePostReport(id: string) {
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  async function handleReport() {
    if (!reportReason) return;
    setReporting(true);
    setReportMsg(null);
    try {
      await axios.post("/api/reports", { targetType: "POST", targetId: id, reason: reportReason });
      setReportMsg("Your report has been submitted.");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong.";
      setReportMsg(msg);
    } finally {
      setReporting(false);
    }
  }

  return { reportModal, setReportModal, reportReason, setReportReason, reporting, reportMsg, setReportMsg, handleReport };
}
