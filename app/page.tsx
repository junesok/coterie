import { redirect } from "next/navigation";

// 루트 접근 시 피드로 리다이렉트 (proxy.ts가 비로그인 시 /login으로 보냄)
export default function RootPage() {
  redirect("/feed");
}
