"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { ImageUploader } from "@/components/ImageUploader";
import { MentionInput } from "@/components/MentionInput";

interface PostFormProps {
  initialContent?: string;
  initialImages?: string[];
  postId?: string; // 수정 모드일 때
}

export function PostForm({ initialContent = "", initialImages = [], postId }: PostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);

  // 이미 Cloudinary에 있는 URL (수정 모드 초기값 or 빈 배열)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialImages);
  // 로컬에서 선택된 파일 (저장 시 업로드)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const MAX_CHARS = 500;
  const isEdit = !!postId;

  /** pendingFiles를 브라우저에서 Cloudinary로 직접 업로드 */
  async function uploadPendingFiles(): Promise<string[]> {
    if (pendingFiles.length === 0) return [];

    setUploadProgress("Uploading images...");

    // 서버에서 서명 발급
    const signRes = await axios.post<{
      timestamp: string;
      signature: string;
      apiKey: string;
      cloudName: string;
      folder: string;
    }>("/api/upload/sign");

    const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

    // 브라우저가 Cloudinary REST API에 직접 전송
    const urls = await Promise.all(
      pendingFiles.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        fd.append("timestamp", timestamp);
        fd.append("api_key", apiKey);
        fd.append("signature", signature);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: fd }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? "Image upload failed");
        }

        const data = await res.json();
        return data.secure_url as string;
      })
    );

    setUploadProgress(null);
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. 클라이언트 검증
      const hasContent = content.trim().length > 0;
      const hasPending = pendingFiles.length > 0;
      const hasUploaded = uploadedUrls.length > 0;
      if (!hasContent && !hasPending && !hasUploaded) {
        setError("Write something or attach an image.");
        setLoading(false);
        return;
      }
      if (content.trim().length > MAX_CHARS) {
        setError(`Content must be ${MAX_CHARS} characters or less.`);
        setLoading(false);
        return;
      }

      // 2. 선택된 파일이 있으면 Cloudinary에 업로드
      const newUrls = await uploadPendingFiles();
      const allImages = [...uploadedUrls, ...newUrls];

      // 2. 게시물 저장
      if (isEdit) {
        await axios.put(`/api/posts/${postId}`, { content, images: allImages });
        router.push(`/post/${postId}`);
      } else {
        const res = await axios.post("/api/posts", { content, images: allImages });
        router.push(`/post/${res.data.post.id}`);
      }
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Something went wrong.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <NavBar title={isEdit ? "edit post" : "new post"} showBack />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-4 gap-3">
        {/* 이미지 선택 (업로드는 저장 시 수행) */}
        <ImageUploader
          uploadedUrls={uploadedUrls}
          pendingFiles={pendingFiles}
          onUploadedUrlsChange={setUploadedUrls}
          onPendingFilesChange={setPendingFiles}
        />

        {/* 텍스트 입력 — @mention 자동완성 포함 */}
        <div className="flex flex-col flex-1 gap-1">
          <MentionInput
            multiline
            className="xp-input flex-1 resize-none min-h-[200px]"
            placeholder="what's on your mind..."
            value={content}
            onChange={setContent}
            dropdownDirection="down"
          />
          <div className="flex justify-end">
            <span
              className="text-[11px]"
              style={{
                color: content.length > MAX_CHARS ? "var(--danger)" : "var(--text-sub)",
                fontFamily: "Tahoma, sans-serif",
              }}
            >
              {content.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        {uploadProgress && (
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>{uploadProgress}</p>
        )}

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
            cancel
          </button>
          <button
            type="submit"
            className="xp-btn"
            disabled={loading}
            style={{ borderColor: "var(--point)", color: "var(--point)", fontWeight: "bold" }}
          >
            {loading ? (uploadProgress ?? "saving...") : (isEdit ? "save" : "post")}
          </button>
        </div>
      </form>
    </div>
  );
}
