"use client";

import Image from "next/image";

interface AvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ avatarUrl, username, size = 40, className = "" }: AvatarProps) {
  const src = avatarUrl || "/default-profile.png";

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg-card)",
        position: "relative",
      }}
    >
      <Image
        src={src}
        alt={username ?? "profile"}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        unoptimized={!avatarUrl} // 로컬 기본 이미지는 최적화 불필요
      />
    </div>
  );
}
