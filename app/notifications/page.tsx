"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { NavBar } from "@/components/NavBar";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

type NotifType =
  | "COMMENT"
  | "LIKE"
  | "MENTION_POST"
  | "MENTION_COMMENT"
  | "ADMIN_DELETE_POST"
  | "ADMIN_DELETE_COMMENT";

interface NotificationItem {
  id: string;
  type: NotifType;
  isRead: boolean;
  createdAt: string;
  postId: string | null;
  commentId: string | null;
  reason: string | null;
  actor: { id: string; username: string | null; name: string } | null;
}

function getNotificationMessage(n: NotificationItem): string {
  const actor = n.actor ? `@${n.actor.username ?? n.actor.name}` : "누군가";
  switch (n.type) {
    case "COMMENT":
      return `${actor} 님이 댓글을 남겼어요.`;
    case "LIKE":
      return `${actor} 님이 좋아요를 눌렀어요.`;
    case "MENTION_POST":
      return `${actor} 님이 게시물에서 회원님을 언급했어요.`;
    case "MENTION_COMMENT":
      return `${actor} 님이 댓글에서 회원님을 언급했어요.`;
    case "ADMIN_DELETE_POST":
      return `관리자에 의해 게시물이 삭제되었어요. 사유: ${REASON_LABELS[n.reason ?? ""] ?? n.reason}`;
    case "ADMIN_DELETE_COMMENT":
      return `관리자에 의해 댓글이 삭제되었어요. 사유: ${REASON_LABELS[n.reason ?? ""] ?? n.reason}`;
    default:
      return "새로운 알림이 있어요.";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const res = await axios.get("/api/notifications");
    setNotifications(res.data.notifications);
    setLoading(false);
  }

  async function handleClick(n: NotificationItem) {
    // 읽음 처리
    if (!n.isRead) {
      await axios.put(`/api/notifications/${n.id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
    }

    // 해당 게시물로 이동
    if (n.postId) {
      router.push(`/post/${n.postId}`);
    }
  }

  async function handleReadAll() {
    await axios.put("/api/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col flex-1">
      <NavBar title="알림" showBack />

      <div className="p-3">
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            className="xp-btn text-xs mb-3 w-full"
          >
            전체 읽음 처리 ({unreadCount})
          </button>
        )}

        {loading ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>
            불러오는 중...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>
            알림이 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="xp-window p-3 text-left w-full"
                style={{
                  opacity: n.isRead ? 0.6 : 1,
                  cursor: n.postId ? "pointer" : "default",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {!n.isRead && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                        style={{ background: "var(--point)" }}
                      />
                    )}
                    <span className="text-xs" style={{ color: "var(--text-base)" }}>
                      {getNotificationMessage(n)}
                    </span>
                  </div>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-sub)" }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ko })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
