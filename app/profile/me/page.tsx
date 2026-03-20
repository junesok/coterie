"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// /profile/me → /profile/[username] 으로 리다이렉트
export default function MyProfileRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.username) {
      router.replace(`/profile/${session.user.username}`);
    } else {
      router.replace("/feed");
    }
  }, [session, status, router]);

  return null;
}
