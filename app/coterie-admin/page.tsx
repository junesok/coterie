import { redirect } from "next/navigation";

// /coterie-admin 진입 시 dashboard로 리다이렉트
export default function AdminRoot() {
  redirect("/coterie-admin/dashboard");
}
