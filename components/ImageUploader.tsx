"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageUploaderProps {
  /** 이미 Cloudinary에 올라간 URL (수정 모드) */
  uploadedUrls: string[];
  /** 로컬에서 선택된 파일 (저장 시 업로드) */
  pendingFiles: File[];
  onUploadedUrlsChange: (urls: string[]) => void;
  onPendingFilesChange: (files: File[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  uploadedUrls,
  pendingFiles,
  onUploadedUrlsChange,
  onPendingFilesChange,
  maxImages = 3,
}: ImageUploaderProps) {
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = uploadedUrls.length + pendingFiles.length;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = maxImages - totalCount;
    const toAdd = files.slice(0, remaining);

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        toAdd.map((file) =>
          imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          })
        )
      );
      onPendingFilesChange([...pendingFiles, ...compressed]);
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {/* 미리보기 */}
      {totalCount > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {/* 이미 업로드된 이미지 (수정 모드) */}
          {uploadedUrls.map((url, i) => (
            <div key={`up-${i}`} className="relative w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`이미지 ${i + 1}`}
                className="w-24 h-24 object-cover"
                style={{ border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={() => onUploadedUrlsChange(uploadedUrls.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 xp-btn p-0.5"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
              >
                <Trash2 size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}

          {/* 로컬 선택된 이미지 (저장 전 미리보기) */}
          {pendingFiles.map((file, i) => (
            <div key={`pend-${i}`} className="relative w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={`새 이미지 ${i + 1}`}
                className="w-24 h-24 object-cover"
                style={{ border: "2px solid var(--point)", opacity: 0.9 }}
              />
              <button
                type="button"
                onClick={() => onPendingFilesChange(pendingFiles.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 xp-btn p-0.5"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
              >
                <Trash2 size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      {totalCount < maxImages && (
        <button
          type="button"
          className="xp-btn flex items-center gap-1 text-sm"
          disabled={compressing}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} strokeWidth={1.5} />
          {compressing ? "처리 중..." : `이미지 추가 (${totalCount}/${maxImages})`}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
