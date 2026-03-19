"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface DashboardData {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  newUsersToday: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/dashboard").then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-sm" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>;

  const stats = [
    { label: "전체 유저", value: data?.totalUsers ?? 0 },
    { label: "전체 게시물", value: data?.totalPosts ?? 0 },
    { label: "전체 댓글", value: data?.totalComments ?? 0 },
    { label: "오늘 신규 가입", value: data?.newUsersToday ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-sm font-bold mb-4" style={{ color: "var(--text-base)" }}>대시보드</h1>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="xp-window p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--point)" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
