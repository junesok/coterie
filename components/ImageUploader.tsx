"use client";

import { useState, useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import axios from "axios";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ value, onChange, maxImages = 3 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = maxImages - value.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    try {
      // 클라이언트 측 압축
      const compressed = await Promise.all(
        toUpload.map((file) =>
          imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          })
        )
      );

      const formData = new FormData();
      compressed.forEach((f) => formData.append("images", f));

      const res = await axios.post<{ success: boolean; urls: string[] }>(
        "/api/upload/image",
        formData
      );

      if (res.data.success) {
        onChange([...value, ...res.data.urls]);
      }
    } catch (err) {
      console.error("이미지 업로드 실패", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* 미리보기 */}
      {value.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {value.map((url, i) => (
            <div key={i} className="relative w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`이미지 ${i + 1}`}
                className="w-24 h-24 object-cover"
                style={{ border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 xp-btn p-0.5"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
              >
                <Trash2 size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      {value.length < maxImages && (
        <button
          type="button"
          className="xp-btn flex items-center gap-1 text-sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} strokeWidth={1.5} />
          {uploading ? "업로드 중..." : `이미지 추가 (${value.length}/${maxImages})`}
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
