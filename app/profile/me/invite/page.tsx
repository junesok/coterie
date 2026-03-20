"use client";

import { useEffect, useState } from "react";
import { Copy, Key } from "lucide-react";
import axios from "axios";
import { NavBar } from "@/components/NavBar";

interface InviteCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy: { name: string } | null;
  usedAt: string | null;
}

export default function InvitePage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/invite/my-codes").then((res) => {
      if (res.data.success) setCodes(res.data.codes);
    }).finally(() => setLoading(false));
  }, []);

  function handleCopy(code: string) {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col flex-1">
      <NavBar title="초대 코드" showBack />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-sub)" }}>불러오는 중...</p>
        ) : codes.length === 0 ? (
          <div className="xp-window p-4 text-center">
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>
              발급된 초대 코드가 없습니다.
            </p>
          </div>
        ) : (
          codes.map((code) => (
            <div key={code.id} className="xp-window" style={{ opacity: code.isUsed ? 0.6 : 1 }}>
              <div className="xp-titlebar">
                <div className="flex items-center gap-1.5">
                  <Key size={12} strokeWidth={1.5} />
                  <span className="text-xs">{code.isUsed ? "사용됨" : "미사용"}</span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span
                  className="text-sm font-mono tracking-wider"
                  style={{ color: code.isUsed ? "var(--text-sub)" : "var(--text-base)" }}
                >
                  {code.code}
                </span>
                <button
                  className="xp-btn flex items-center gap-1 text-xs py-0.5"
                  onClick={() => handleCopy(code.code)}
                  disabled={code.isUsed}
                >
                  <Copy size={12} strokeWidth={1.5} />
                  {copied === code.code ? "복사됨!" : "링크 복사"}
                </button>
              </div>
              {code.isUsed && code.usedBy && (
                <p className="px-3 pb-2 text-xs" style={{ color: "var(--text-sub)" }}>
                  사용자: {code.usedBy.name}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
