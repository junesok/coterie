"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Plus } from "lucide-react";
import axios from "axios";

interface DashboardData {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  newUsersToday: number;
}

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [count, setCount] = useState(1);

  const fetchCodes = useCallback(async () => {
    const res = await axios.get("/api/admin/invite");
    setCodes(res.data.codes);
    setCodesLoading(false);
  }, []);

  useEffect(() => {
    axios.get("/api/admin/dashboard").then((res) => {
      setData(res.data.data);
      setStatsLoading(false);
    });
    fetchCodes();
  }, [fetchCodes]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await axios.post("/api/admin/invite", { count });
      setCodes((prev) => [
        ...res.data.codes.map((c: { code: string }) => ({
          id: crypto.randomUUID(),
          code: c.code,
          createdAt: new Date().toISOString(),
        })),
        ...prev,
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const stats = [
    { label: "전체 유저", value: data?.totalUsers ?? 0 },
    { label: "전체 게시물", value: data?.totalPosts ?? 0 },
    { label: "전체 댓글", value: data?.totalComments ?? 0 },
    { label: "오늘 신규 가입", value: data?.newUsersToday ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 통계 */}
      <div>
        <h2 className="text-xs font-bold mb-2" style={{ color: "var(--text-sub)" }}>통계</h2>
        {statsLoading ? (
          <p className="text-xs" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ label, value }) => (
              <div key={label} className="xp-window p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--point)" }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 초대 코드 직접 생성 */}
      <div className="xp-window">
        <div className="xp-titlebar"><span>초대 코드 발급</span></div>
        <div className="p-3 flex flex-col gap-3">
          {/* 생성 폼 */}
          <div className="flex items-center gap-2">
            <label className="text-xs whitespace-nowrap" style={{ color: "var(--text-sub)" }}>
              개수
            </label>
            <select
              className="xp-input text-sm"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: 64 }}
            >
              {[1, 2, 3, 5, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="xp-btn text-xs flex items-center gap-1"
            >
              <Plus size={12} strokeWidth={1.5} />
              {generating ? "생성 중..." : "코드 생성"}
            </button>
          </div>

          {/* 미사용 코드 목록 */}
          {codesLoading ? (
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
          ) : codes.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              미사용 초대 코드가 없어요. 위에서 생성하세요.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5"
                  style={{ background: "var(--bg-page)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="text-xs font-mono font-bold tracking-wide"
                    style={{ color: "var(--point)" }}
                  >
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleCopy(c.code, c.id)}
                    className="xp-btn text-xs flex items-center gap-1 py-0.5 px-2"
                  >
                    {copiedId === c.id ? (
                      <><Check size={11} strokeWidth={2} /> 복사됨</>
                    ) : (
                      <><Copy size={11} strokeWidth={1.5} /> 복사</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>
            생성된 코드는 관리자 소유이며, 누구에게든 공유할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
