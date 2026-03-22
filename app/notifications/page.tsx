"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { UserPlus, UserCheck } from "lucide-react";
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
  | "ADMIN_DELETE_COMMENT"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPT";

interface NotificationItem {
  id: string;
  type: NotifType;
  isRead: boolean;
  createdAt: string;
  postId: string | null;
  commentId: string | null;
  friendshipId: string | null;
  friendshipStatus: string | null;
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
    case "COMMENT":         return <>{actorLink} left a comment.</>;
    case "LIKE":            return <>{actorLink} liked your post.</>;
    case "MENTION_POST":    return <>{actorLink} mentioned you in a post.</>;
    case "MENTION_COMMENT": return <>{actorLink} mentioned you in a comment.</>;
    case "FRIEND_REQUEST":  return <>{actorLink} sent you a friend request.</>;
    case "FRIEND_ACCEPT":   return <>{actorLink} accepted your friend request.</>;
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
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const res = await axios.get("/api/notifications");
    setNotifications(res.data.notifications);
    setLoading(false);
  }

  async function markRead(id: string) {
    await axios.put(`/api/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }

  async function handleClick(n: NotificationItem) {
    if (!n.isRead) await markRead(n.id);
    if (n.postId) router.push(`/post/${n.postId}`);
  }

  async function handleFriendResponse(n: NotificationItem, action: "accept" | "reject") {
    if (!n.friendshipId) return;
    setResponding(n.id);
    try {
      await axios.put(`/api/friends/${n.friendshipId}`, { action });
      if (!n.isRead) await markRead(n.id);
      // 알림 목록 새로고침
      const res = await axios.get("/api/notifications");
      setNotifications(res.data.notifications);
    } catch {
      // ignore
    } finally {
      setResponding(null);
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
          <button onClick={handleReadAll} className="xp-btn text-xs mb-3 w-full">
            mark all as read ({unreadCount})
          </button>
        )}

        {loading ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>No notifications.</p>
        ) : (
          <div className="xp-window overflow-hidden">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                style={{
                  borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
                  opacity: n.isRead ? 0.55 : 1,
                  background: n.isRead ? "transparent" : "var(--bg-card)",
                }}
              >
                <div
                  className="flex items-start justify-between gap-2 px-3 py-2.5"
                  onClick={() => handleClick(n)}
                  style={{ cursor: n.postId ? "pointer" : "default" }}
                >
                  <div className="flex-1 min-w-0 flex items-start gap-1.5">
                    {!n.isRead && (
                      <span
                        className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--point)" }}
                      />
                    )}
                    <span className="text-xs leading-relaxed" style={{ color: "var(--text-base)" }}>
                      {getNotificationMessage(n)}
                    </span>
                  </div>
                  <span className="text-[10px] whitespace-nowrap shrink-0 mt-0.5" style={{ color: "var(--text-sub)" }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: enUS })}
                  </span>
                </div>

                {/* 친구 신청 수락/거절 버튼 — PENDING 상태일 때만 표시 */}
                {n.type === "FRIEND_REQUEST" && n.friendshipId && n.friendshipStatus === "PENDING" && (
                  <div className="flex gap-2 px-3 pb-2.5">
                    <button
                      className="xp-btn text-xs flex items-center gap-1"
                      style={{ color: "var(--point)", borderColor: "var(--point)" }}
                      disabled={responding === n.id}
                      onClick={(e) => { e.stopPropagation(); handleFriendResponse(n, "accept"); }}
                    >
                      <UserCheck size={12} strokeWidth={1.5} />
                      accept
                    </button>
                    <button
                      className="xp-btn text-xs flex items-center gap-1"
                      style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      disabled={responding === n.id}
                      onClick={(e) => { e.stopPropagation(); handleFriendResponse(n, "reject"); }}
                    >
                      <UserPlus size={12} strokeWidth={1.5} style={{ transform: "rotate(45deg)" }} />
                      reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
