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
              className="xp-btn p-1 flex items-center gap-1 text-white"
              style={{ background: "transparent", border: "none", boxShadow: "none" }}
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
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
              style={{ background: "transparent", border: "none" }}
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
    <div className="flex gap-1">
      <button
        onClick={onEdit}
        className="xp-btn py-0.5 px-2 flex items-center gap-1 text-xs text-white"
        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "none" }}
      >
        <Pencil size={12} strokeWidth={1.5} />
        수정
      </button>
      <button
        onClick={onDelete}
        className="xp-btn py-0.5 px-2 flex items-center gap-1 text-xs"
        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "none", color: "#ffaaaa" }}
      >
        <Trash2 size={12} strokeWidth={1.5} />
        삭제
      </button>
    </div>
  );
}
