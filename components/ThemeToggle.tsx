"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 불일치 방지
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      className="xp-btn flex items-center gap-1.5 text-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
      {isDark ? "라이트" : "다크"}
    </button>
  );
}
