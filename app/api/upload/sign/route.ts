import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHash } from "crypto";

// POST /api/upload/sign — Cloudinary 서명 발급 (실제 업로드는 브라우저가 직접 수행)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "coterie";

  // 서명: SHA-256(folder=coterie&timestamp=...{API_SECRET})
  const payload = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha256")
    .update(payload + process.env.CLOUDINARY_API_SECRET!)
    .digest("hex");

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  });
}
