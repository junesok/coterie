import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth-guard";

// POST /api/upload/sign — Cloudinary 서명 발급 (실제 업로드는 브라우저가 직접 수행)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  // 사용자당 1분에 20회 제한 (Cloudinary 쿼터 보호)
  const rl = rateLimit(`upload-sign:${session.user.id}`, 20, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many upload requests. Please try again later." }, { status: 429 });
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
