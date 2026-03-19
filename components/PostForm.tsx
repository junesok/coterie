"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ImageUploader } from "@/components/ImageUploader";

interface PostFormProps {
  initialContent?: string;
  initialImages?: string[];
  postId?: string; // 수정 모드일 때
}

export function PostForm({ initialContent = "", initialImages = [], postId }: PostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<string[]>(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!postId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit) {
        await axios.put(`/api/posts/${postId}`, { content, images });
        router.push(`/post/${postId}`);
      } else {
        const res = await axios.post("/api/posts", { content, images });
        router.push(`/post/${res.data.post.id}`);
      }
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "오류가 발생했습니다.");
      } else {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <NavBar title={isEdit ? "게시물 수정" : "새 글 작성"} showBack />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-4 gap-3">
        {/* 이미지 업로드 */}
        <ImageUploader value={images} onChange={setImages} />

        {/* 텍스트 입력 */}
        <textarea
          className="xp-input flex-1 resize-none min-h-[200px]"
          placeholder="내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        {error && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="xp-btn"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            type="submit"
            className="xp-btn"
            disabled={loading}
            style={{ borderColor: "var(--point)", color: "var(--point)", fontWeight: "bold" }}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
