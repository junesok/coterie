"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type ReportStatus = "PENDING" | "DISMISSED" | "ACTIONED";

interface AdminReport {
  id: string;
  targetType: "POST" | "COMMENT";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; username: string | null; name: string };
  target: PostTarget | CommentTarget | null;
}

interface PostTarget {
  id: string;
  content: string;
  isHidden: boolean;
  deletedAt: string | null;
  createdAt: string;
  images: { url: string }[];
  author: { id: string; username: string | null; name: string };
}

interface CommentTarget {
  id: string;
  content: string | null;
  isDeleted: boolean;
  isHidden: boolean;
  createdAt: string;
  post: { id: string; content: string } | null;
  author: { id: string; username: string | null; name: string };
}

const REASON_LABELS: Record<string, string> = {
  SEXUAL_CONTENT: "성적 콘텐츠",
  HATE_SPEECH: "혐오 발언",
  SPAM: "스팸",
  VIOLENCE: "폭력",
  PRIVACY_VIOLATION: "개인정보 침해",
  OTHER: "기타",
};

const MODERATION_REASONS = [
  { value: "SEXUAL_CONTENT", label: "성적 콘텐츠" },
  { value: "HATE_SPEECH", label: "혐오 발언" },
  { value: "SPAM", label: "스팸" },
  { value: "VIOLENCE", label: "폭력" },
  { value: "PRIVACY_VIOLATION", label: "개인정보 침해" },
  { value: "OTHER", label: "기타" },
];

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportStatus>("PENDING");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ report: AdminReport; action: string } | null>(null);
  const [actionReason, setActionReason] = useState("OTHER");
  const [acting, setActing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const res = await axios.get(`/api/admin/reports?status=${tab}`);
    setReports(res.data.reports);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleAction(reportId: string, action: string, reason?: string) {
    setActing(true);
    try {
      await axios.put(`/api/admin/reports/${reportId}`, { action, reason });
      setActionModal(null);
      await fetchReports();
    } catch {
      alert("처리 실패");
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h1 className="text-sm font-bold" style={{ color: "var(--text-base)" }}>신고 관리</h1>
        <span className="text-xs" style={{ color: "var(--text-sub)" }}>({reports.length})</span>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-3">
        {(["PENDING", "DISMISSED", "ACTIONED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className="xp-btn text-xs px-3"
            style={tab === s ? { background: "var(--point)", color: "#fff", borderColor: "var(--point)" } : {}}
          >
            {s === "PENDING" ? "대기 중" : s === "DISMISSED" ? "기각됨" : "조치됨"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>신고가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDismiss={() => handleAction(report.id, "dismiss")}
              onAction={(action) => {
                setActionModal({ report, action });
                setActionReason("OTHER");
              }}
            />
          ))}
        </div>
      )}

      {/* 조치 사유 선택 모달 */}
      {actionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="xp-window w-72">
            <div className="xp-titlebar">
              <span>
                {actionModal.action === "hide_post" || actionModal.action === "hide_comment" ? "숨김 처리" : "완전 삭제"}
              </span>
              <button className="xp-ctrl-btn close" onClick={() => setActionModal(null)} />
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                {actionModal.action.includes("delete")
                  ? "이 작업은 되돌릴 수 없습니다."
                  : "숨김 처리 후 관리자 패널에서 복구 가능합니다."}
              </p>
              <select
                className="xp-input text-xs"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              >
                {MODERATION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button className="xp-btn text-xs" onClick={() => setActionModal(null)}>취소</button>
                <button
                  className="xp-btn text-xs"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  disabled={acting}
                  onClick={() => handleAction(actionModal.report.id, actionModal.action, actionReason)}
                >
                  {acting ? "처리 중..." : "확인"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  onDismiss,
  onAction,
}: {
  report: AdminReport;
  onDismiss: () => void;
  onAction: (action: string) => void;
}) {
  const target = report.target;
  const isPost = report.targetType === "POST";
  const postTarget = isPost ? (target as PostTarget | null) : null;
  const commentTarget = !isPost ? (target as CommentTarget | null) : null;
  const isUserDeleted = postTarget?.deletedAt != null;
  const isAlreadyHidden = postTarget?.isHidden || commentTarget?.isHidden;

  return (
    <div className="xp-window p-3">
      {/* 신고 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span
            className="text-[10px] px-1.5 py-0.5 mr-1.5"
            style={{
              background: isPost ? "var(--point)" : "var(--text-sub)",
              color: "#fff",
              borderRadius: 3,
            }}
          >
            {isPost ? "게시물" : "댓글"}
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--danger)" }}>
            {REASON_LABELS[report.reason] ?? report.reason}
          </span>
        </div>
        <span className="text-[10px] shrink-0" style={{ color: "var(--text-sub)" }}>
          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ko })}
        </span>
      </div>

      {/* 신고자 */}
      <p className="text-[11px] mb-2" style={{ color: "var(--text-sub)" }}>
        신고자: @{report.reporter.username ?? report.reporter.name}
      </p>

      {/* 대상 콘텐츠 */}
      {!target ? (
        <p className="text-xs italic" style={{ color: "var(--text-sub)" }}>콘텐츠를 찾을 수 없음 (이미 삭제됨)</p>
      ) : (
        <div
          className="p-2 mb-2 text-xs"
          style={{
            background: "var(--bg-page)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            color: "var(--text-base)",
          }}
        >
          {isPost && postTarget && (
            <>
              <p className="font-bold mb-0.5" style={{ color: "var(--text-sub)" }}>
                @{postTarget.author.username ?? postTarget.author.name}
                {isUserDeleted && (
                  <span className="ml-1.5 text-[10px]" style={{ color: "var(--danger)" }}>[사용자 삭제됨]</span>
                )}
                {isAlreadyHidden && (
                  <span className="ml-1.5 text-[10px]" style={{ color: "var(--text-sub)" }}>[숨김 처리됨]</span>
                )}
              </p>
              <p style={{ lineHeight: 1.5 }}>{postTarget.content}</p>
              {postTarget.images.length > 0 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={postTarget.images[0].url} alt="" className="mt-1 rounded" style={{ maxHeight: 80, objectFit: "cover" }} />
              )}
            </>
          )}
          {!isPost && commentTarget && (
            <>
              <p className="font-bold mb-0.5" style={{ color: "var(--text-sub)" }}>
                @{commentTarget.author.username ?? commentTarget.author.name}
                {commentTarget.isDeleted && (
                  <span className="ml-1.5 text-[10px]" style={{ color: "var(--danger)" }}>[사용자 삭제됨]</span>
                )}
                {commentTarget.isHidden && (
                  <span className="ml-1.5 text-[10px]" style={{ color: "var(--text-sub)" }}>[숨김 처리됨]</span>
                )}
              </p>
              {commentTarget.content ? (
                <p style={{ lineHeight: 1.5 }}>{commentTarget.content}</p>
              ) : (
                <p className="italic" style={{ color: "var(--text-sub)" }}>(내용 삭제됨)</p>
              )}
              {commentTarget.post && (
                <p className="mt-1 text-[10px]" style={{ color: "var(--text-sub)" }}>
                  게시물: {commentTarget.post.content.slice(0, 40)}…
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* 처리 버튼 (PENDING만) */}
      {report.status === "PENDING" && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={onDismiss}
            className="xp-btn text-xs"
          >
            기각{isUserDeleted ? " (삭제 정리)" : ""}
          </button>
          {!isUserDeleted && isPost && !isAlreadyHidden && (
            <button
              onClick={() => onAction("hide_post")}
              className="xp-btn text-xs"
              style={{ color: "var(--point)" }}
            >
              게시물 숨김
            </button>
          )}
          {!isUserDeleted && isPost && (
            <button
              onClick={() => onAction("delete_post")}
              className="xp-btn text-xs"
              style={{ color: "var(--danger)" }}
            >
              게시물 삭제
            </button>
          )}
          {!isPost && !commentTarget?.isDeleted && !isAlreadyHidden && (
            <button
              onClick={() => onAction("hide_comment")}
              className="xp-btn text-xs"
              style={{ color: "var(--point)" }}
            >
              댓글 숨김
            </button>
          )}
          {!isPost && (
            <button
              onClick={() => onAction("delete_comment")}
              className="xp-btn text-xs"
              style={{ color: "var(--danger)" }}
            >
              댓글 삭제
            </button>
          )}
        </div>
      )}

      {/* 처리 완료 표시 */}
      {report.status !== "PENDING" && (
        <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>
          {report.status === "DISMISSED" ? "기각됨" : "조치됨"}
          {report.resolvedAt && ` · ${formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true, locale: ko })}`}
        </p>
      )}
    </div>
  );
}
