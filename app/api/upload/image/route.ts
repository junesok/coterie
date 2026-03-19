import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHash } from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

// Cloudinary 서명 생성 (SHA-256)
function sign(params: Record<string, string>): string {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha256").update(payload + API_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "이미지가 없습니다." }, { status: 400 });
    }

    if (files.length > 3) {
      return NextResponse.json({ success: false, error: "이미지는 최대 3장까지 업로드할 수 있습니다." }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const sigParams = { folder: "coterie", timestamp };
      const signature = sign(sigParams);

      // Cloudinary REST API에 직접 multipart 전송 (SDK 없음)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "coterie");
      fd.append("timestamp", timestamp);
      fd.append("api_key", API_KEY);
      fd.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Cloudinary error ${res.status}`);
      }

      const data = await res.json();
      return data.secure_url as string;
    });

    const urls = await Promise.all(uploadPromises);
    return NextResponse.json({ success: true, urls });
  } catch (error) {
    console.error("[POST /api/upload/image]", error);
    return NextResponse.json({ success: false, error: "이미지 업로드에 실패했습니다." }, { status: 500 });
  }
}
