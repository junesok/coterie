"use client";

import { ChevronLeft, Settings, Pencil, Trash2, Bell, ShieldCheck, CircleUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface NavBarProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  showNotification?: boolean;
}

// 내 프로필 아바타 훅
function useMyAvatar() {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    axios
      .get("/api/users/me")
      .then((res) => setAvatarUrl(res.data.user?.avatarUrl ?? null))
      .catch(() => {});
  }, [session]);

  return avatarUrl;
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
        .catch(() => {});
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
  const { data: session } = useSession();
  const unreadCount = useUnreadCount(showNotification);
  const myAvatarUrl = useMyAvatar();
  const isAdmin = session?.user?.isAdmin;
  const username = session?.user?.username;

  return (
    <div>
      {/* relative 컨테이너 — 가운데 coterie 링크 절대 배치용 */}
      <div className="xp-titlebar relative flex items-center justify-between px-4 py-3">

        {/* 왼쪽 — back 버튼 or 타이틀 */}
        <div className="flex items-center gap-2.5 z-10">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-white"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.55)",
                boxShadow: "inset 0 1px rgba(255,255,255,0.25)",
                borderRadius: 4,
                padding: "5px 10px 5px 6px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "Tahoma, sans-serif",
              }}
            >
              <ChevronLeft size={20} strokeWidth={2} />
              <span style={{ lineHeight: 1 }}>back</span>
            </button>
          ) : (
            <span className="font-bold text-base text-white" style={{ fontFamily: "Tahoma, sans-serif" }}>
              {title}
            </span>
          )}
        </div>

        {/* 가운데 — showBack일 때만 coterie → /feed 링크 */}
        {showBack && (
          <a
            href="/feed"
            className="absolute left-1/2 -translate-x-1/2 font-bold text-white"
            style={{
              fontFamily: "Tahoma, sans-serif",
              fontSize: 15,
              textDecoration: "none",
              letterSpacing: "0.01em",
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            coterie
          </a>
        )}

        {/* 오른쪽 — 아이콘 버튼들 */}
        <div className="flex items-center gap-1.5 z-10">
          {rightSlot}
          {/* 내 프로필 버튼 — 프로필 사진 있으면 이미지, 없으면 아이콘 */}
          <button
            onClick={() => router.push(username ? `/profile/${username}` : "/profile/me")}
            className="relative p-1 text-white"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            title="my profile"
          >
            {myAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={myAvatarUrl}
                alt="my profile"
                width={28}
                height={28}
                style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.7)", width: 28, height: 28 }}
              />
            ) : (
              <CircleUser size={26} strokeWidth={1.5} />
            )}
          </button>
          {/* 관리자 버튼 */}
          {isAdmin && (
            <button
              onClick={() => router.push("/coterie-admin/dashboard")}
              className="relative p-1.5 text-white"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              title="admin"
            >
              <ShieldCheck size={24} strokeWidth={1.5} />
            </button>
          )}
          {showNotification && (
            <button
              onClick={() => router.push("/notifications")}
              className="relative p-1.5 text-white"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              title="notifications"
            >
              <Bell size={24} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 flex items-center justify-center text-[9px] font-bold leading-none rounded-full"
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    minWidth: 15,
                    height: 15,
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
        edit
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
        delete
      </button>
    </div>
  );
}
