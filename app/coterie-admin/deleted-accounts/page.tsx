"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface DeletedUser {
  id: string;
  username: string | null;
  name: string;
  email: string;
  deletedAt: string;
  isExpired: boolean;
  _count: { posts: number };
}

export default function DeletedAccountsPage() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  useEffect(() => {
    axios.get("/api/admin/users/deleted").then((res) => {
      setUsers(res.data.users);
      setLoading(false);
    });
  }, []);

  const recoverable = users.filter((u) => !u.isExpired);
  const expired = users.filter((u) => u.isExpired);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectGroup(group: DeletedUser[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      group.forEach((u) => next.add(u.id));
      return next;
    });
  }

  function deselectGroup(group: DeletedUser[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      group.forEach((u) => next.delete(u.id));
      return next;
    });
  }

  function isGroupAllSelected(group: DeletedUser[]) {
    return group.length > 0 && group.every((u) => selected.has(u.id));
  }

  async function handleBulkAction(action: "recover" | "delete") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Permanently delete ${ids.length} account(s)? This cannot be undone.`)) return;

    setActing(true);
    try {
      await axios.post("/api/admin/users/deleted", { action, userIds: ids });
      setUsers((prev) => {
        if (action === "recover") return prev.map((u) => ids.includes(u.id) ? { ...u, isExpired: false, deletedAt: "" } : u).filter((u) => !ids.includes(u.id));
        return prev.filter((u) => !ids.includes(u.id));
      });
      setSelected(new Set());
    } catch {
      alert(`Action failed.`);
    } finally {
      setActing(false);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>Loading...</p>;

  const selectedRecoverable = recoverable.filter((u) => selected.has(u.id));
  const selectedExpired = expired.filter((u) => selected.has(u.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-sm font-bold" style={{ color: "var(--text-base)" }}>
          Deleted Accounts ({users.length})
        </h1>
        <div className="flex gap-2">
          {selectedRecoverable.length > 0 && (
            <button
              onClick={() => handleBulkAction("recover")}
              disabled={acting}
              className="xp-btn text-xs"
              style={{ color: "var(--point)", borderColor: "var(--point)" }}
            >
              {acting ? "processing..." : `recover (${selectedRecoverable.length})`}
            </button>
          )}
          {selectedExpired.length > 0 && (
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={acting}
              className="xp-btn text-xs"
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
            >
              {acting ? "processing..." : `delete (${selectedExpired.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Recoverable — within 30 days */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold" style={{ color: "var(--text-sub)" }}>
            Within 30 days — recoverable ({recoverable.length})
          </p>
          <button
            className="text-[11px]"
            style={{ color: "var(--point)" }}
            onClick={() => isGroupAllSelected(recoverable) ? deselectGroup(recoverable) : selectGroup(recoverable)}
          >
            {isGroupAllSelected(recoverable) ? "deselect all" : "select all"}
          </button>
        </div>
        {recoverable.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>None.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recoverable.map((user) => (
              <UserRow key={user.id} user={user} selected={selected.has(user.id)} onToggle={toggleSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Expired — past 30 days */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold" style={{ color: "var(--danger)" }}>
            Past 30 days — permanent deletion ({expired.length})
          </p>
          <button
            className="text-[11px]"
            style={{ color: "var(--danger)" }}
            onClick={() => isGroupAllSelected(expired) ? deselectGroup(expired) : selectGroup(expired)}
          >
            {isGroupAllSelected(expired) ? "deselect all" : "select all"}
          </button>
        </div>
        {expired.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>None.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {expired.map((user) => (
              <UserRow key={user.id} user={user} selected={selected.has(user.id)} onToggle={toggleSelect} expired />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  user,
  selected,
  onToggle,
  expired = false,
}: {
  user: DeletedUser;
  selected: boolean;
  onToggle: (id: string) => void;
  expired?: boolean;
}) {
  return (
    <div
      className="xp-window p-3 flex items-start gap-2"
      style={{ opacity: expired ? 0.75 : 1 }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(user.id)}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-base)" }}>
          @{user.username ?? "—"} · {user.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--text-sub)" }}>{user.email}</p>
        <p className="text-[11px] mt-0.5" style={{ color: expired ? "var(--danger)" : "var(--text-sub)" }}>
          Deleted{" "}
          {user.deletedAt
            ? formatDistanceToNow(new Date(user.deletedAt), { addSuffix: true, locale: ko })
            : "—"}
          {" · "}posts: {user._count.posts}
        </p>
      </div>
    </div>
  );
}
