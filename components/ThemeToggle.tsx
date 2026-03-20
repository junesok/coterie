"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 불일치 방지
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  function toggle() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    // DB에 저장 (비동기, 실패 무시)
    axios.put("/api/users/me", { theme: next }).catch(() => {});
  }

  return (
    <button
      className="xp-btn flex items-center gap-1.5 text-sm"
      onClick={toggle}
      title={isDark ? "switch to light mode" : "switch to dark mode"}
    >
      {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
      {isDark ? "light" : "dark"}
    </button>
  );
}
