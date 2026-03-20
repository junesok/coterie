"use client";

import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import axios from "axios";

/**
 * 로그인 직후 DB에 저장된 테마를 불러와 next-themes에 적용.
 * 다기기 동기화: 다른 기기에서 바꾼 테마가 로그인 시 반영됨.
 */
export function ThemeSyncer() {
  const { setTheme } = useTheme();
  const { status } = useSession();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || synced.current) return;
    synced.current = true;

    axios
      .get("/api/users/me")
      .then((res) => {
        const theme = res.data.user?.theme;
        if (theme === "light" || theme === "dark") {
          setTheme(theme);
        }
      })
      .catch(() => {}); // 실패해도 무시 (localStorage 값 유지)
  }, [status, setTheme]);

  return null;
}
