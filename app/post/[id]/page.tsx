"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import axios from "axios";
import { NavBar, EditDeleteButtons } from "@/components/NavBar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { XpDialog } from "@/components/XpDialog";

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
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    axios.get(`/api/posts/${id}`).then((res) => {
      if (res.data.success) setPost(res.data.post);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
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

  const isOwner = session?.user?.id === post?.author.id;

  return (
    <div className="flex flex-col flex-1">
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
        <div className="flex flex-col flex-1">
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

          <hr className="xp-hr mx-4" />

          {/* 댓글 섹션은 4단계에서 구현 */}
          <div className="p-4">
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              댓글 {post._count.comments}개
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-sub)" }}>
              댓글 기능은 곧 추가됩니다.
            </p>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <XpDialog
          title="게시물 삭제"
          message="게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmLabel={deleting ? "삭제 중..." : "삭제"}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          danger
        />
      )}
    </div>
  );
}
