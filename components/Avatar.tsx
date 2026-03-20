"use client";

interface AvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ avatarUrl, username, size = 40, className = "" }: AvatarProps) {
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
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl || "/default-profile.png"}
        alt={username ?? "profile"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}
