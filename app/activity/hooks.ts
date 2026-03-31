"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import type { LikeItem, CommentItem } from "./types";

const LIMIT_LIKES = 5;
const LIMIT_COMMENTS = 10;

// ── 좋아요 목록 ──────────────────────────────────────────────────
export function useLikeActivity() {
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [likesCursor, setLikesCursor] = useState<string | null>(null);
  const [likesHasMore, setLikesHasMore] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);

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

  function resetLikes() {
    setLikes([]);
    setLikesCursor(null);
    setLikesHasMore(false);
  }

  return { likes, likesCursor, likesHasMore, likesLoading, fetchLikes, resetLikes };
}

// ── 댓글 목록 ────────────────────────────────────────────────────
export function useCommentActivity() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

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

  function resetComments() {
    setComments([]);
    setCommentsCursor(null);
    setCommentsHasMore(false);
  }

  return { comments, commentsCursor, commentsHasMore, commentsLoading, fetchComments, resetComments };
}
