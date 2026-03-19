"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const TARGET_LABELS: Record<string, string> = {
  POST: "게시물",
  COMMENT: "댓글",
};

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "선정적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력적 콘텐츠",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

interface LogEntry {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  admin: { username: string | null; name: string };
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/logs").then((res) => {
      setLogs(res.data.logs);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>;

  return (
    <div>
      <h1 className="text-sm font-bold mb-4" style={{ color: "var(--text-base)" }}>
        조치 기록 ({logs.length}건)
      </h1>
      {logs.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-sub)" }}>조치 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <div key={log.id} className="xp-window p-3">
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className="text-xs font-bold px-1"
                  style={{
                    background: log.targetType === "POST" ? "var(--point)" : "#888",
                    color: "#fff",
                  }}
                >
                  {TARGET_LABELS[log.targetType] ?? log.targetType}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-sub)" }}>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-base)" }}>
                사유: {REASON_LABELS[log.reason] ?? log.reason}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>
                처리자: @{log.admin.username ?? log.admin.name} · ID: {log.targetId.slice(0, 8)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
