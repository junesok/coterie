"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { NavBar } from "@/components/NavBar";

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "Sexual content",
  HATE_SPEECH: "Hate speech",
  SPAM: "Spam",
  VIOLENCE: "Violent content",
  PRIVACY_VIOLATION: "Privacy violation",
  OTHER: "Other",
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

function getNotificationMessage(n: NotificationItem): React.ReactNode {
  const actorLabel = n.actor ? `@${n.actor.username ?? n.actor.name}` : "someone";
  const actorLink = n.actor?.username ? (
    <a
      href={`/profile/${n.actor.username}`}
      onClick={(e) => e.stopPropagation()}
      style={{ color: "var(--point)", fontWeight: "bold", textDecoration: "none" }}
    >
      {actorLabel}
    </a>
  ) : (
    <span style={{ fontWeight: "bold" }}>{actorLabel}</span>
  );

  switch (n.type) {
    case "COMMENT":      return <>{actorLink} left a comment.</>;
    case "LIKE":         return <>{actorLink} liked your post.</>;
    case "MENTION_POST": return <>{actorLink} mentioned you in a post.</>;
    case "MENTION_COMMENT": return <>{actorLink} mentioned you in a comment.</>;
    case "ADMIN_DELETE_POST":
      return <>Your post was removed by an admin. Reason: {REASON_LABELS[n.reason ?? ""] ?? n.reason}</>;
    case "ADMIN_DELETE_COMMENT":
      return <>Your comment was removed by an admin. Reason: {REASON_LABELS[n.reason ?? ""] ?? n.reason}</>;
    default:
      return <>You have a new notification.</>;
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
      <NavBar title="notifications" showBack />

      <div className="p-3">
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            className="xp-btn text-xs mb-3 w-full"
          >
            mark all as read ({unreadCount})
          </button>
        )}

        {loading ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>
            No notifications.
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
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: enUS })}
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
