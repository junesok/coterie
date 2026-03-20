"use client";

import { ChevronLeft, Settings, Pencil, Trash2, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

interface NavBarProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  showNotification?: boolean;
}

// 미읽은 알림 수 폴링 훅 (30초 주기)
function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const fetch = () => {
      axios
        .get("/api/notifications")
        .then((res) => setCount(res.data.unreadCount ?? 0))
        .catch(() => {}); // 폴링 실패 무시
    };

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [enabled]);

  return count;
}

export function NavBar({
  title = "coterie",
  showBack = false,
  rightSlot,
  showNotification = true,
}: NavBarProps) {
  const router = useRouter();
  const unreadCount = useUnreadCount(showNotification);

  return (
    <div>
      <div className="xp-titlebar flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-white"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.55)",
                boxShadow: "inset 0 1px rgba(255,255,255,0.25)",
                borderRadius: 3,
                padding: "2px 6px 2px 3px",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "Tahoma, sans-serif",
              }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              <span style={{ lineHeight: 1 }}>뒤로</span>
            </button>
          )}
          <span className="font-bold text-sm text-white">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {rightSlot}
          {showNotification && (
            <button
              onClick={() => router.push("/notifications")}
              className="relative p-1 text-white"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              title="알림"
            >
              <Bell size={16} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-[9px] font-bold leading-none rounded-full"
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    minWidth: 14,
                    height: 14,
                    padding: "0 2px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <hr className="xp-hr" />
    </div>
  );
}

export function SettingsIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1 text-white"
      style={{ background: "transparent", border: "none" }}
    >
      <Settings size={16} strokeWidth={1.5} />
    </button>
  );
}

export function EditDeleteButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        onClick={onEdit}
        className="flex items-center gap-1 text-xs text-white"
        style={{
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "inset 0 1px rgba(255,255,255,0.25)",
          borderRadius: 3,
          padding: "2px 8px",
          cursor: "pointer",
          fontFamily: "Tahoma, sans-serif",
        }}
      >
        <Pencil size={11} strokeWidth={1.5} />
        수정
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-1 text-xs"
        style={{
          background: "rgba(160,0,0,0.35)",
          border: "1px solid rgba(255,120,120,0.7)",
          boxShadow: "inset 0 1px rgba(255,180,180,0.2)",
          borderRadius: 3,
          padding: "2px 8px",
          cursor: "pointer",
          color: "#ffdddd",
          fontFamily: "Tahoma, sans-serif",
        }}
      >
        <Trash2 size={11} strokeWidth={1.5} />
        삭제
      </button>
    </div>
  );
}
