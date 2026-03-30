import { createHash } from "crypto";

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY     = process.env.CLOUDINARY_API_KEY!;
const API_SECRET  = process.env.CLOUDINARY_API_SECRET!;

/**
 * Cloudinary URL에서 public_id 추출
 * 예) https://res.cloudinary.com/cloud/image/upload/v1710000000/coterie/abc123.jpg
 *  → coterie/abc123
 * 예) https://res.cloudinary.com/cloud/image/upload/q_auto,f_auto/coterie/abc123.jpg
 *  → coterie/abc123
 */
export function extractPublicId(url: string): string | null {
  try {
    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return null;

    let path = url.slice(uploadIdx + 8); // "/upload/".length === 8

    // 버전 prefix 제거: v1234567890/
    path = path.replace(/^v\d+\//, "");

    // 변환 파라미터 제거: 세그먼트에 '_' 또는 ',' 포함 시 변환으로 간주
    // e.g. "q_auto,f_auto/" → 제거, "coterie/" → 유지
    const segments = path.split("/");
    const cleaned: string[] = [];
    for (const seg of segments) {
      // 변환 세그먼트 패턴: 언더스코어+알파벳 조합이거나 콤마 포함 (q_auto, f_auto, w_400 등)
      // 실제 폴더/파일명은 이런 패턴이 없으므로 안전하게 제거 가능
      if (/^[a-z_,]+$/.test(seg) && (seg.includes("_") || seg.includes(","))) continue;
      cleaned.push(seg);
    }
    path = cleaned.join("/");

    // 파일 확장자 제거 (.jpg, .png, .webp 등)
    path = path.replace(/\.[a-zA-Z0-9]+$/, "");

    return path || null;
  } catch {
    return null;
  }
}

/**
 * Cloudinary에서 이미지 삭제 (Destroy API, fetch 기반)
 * 실패해도 throw하지 않음 — DB 삭제를 막으면 안 되기 때문
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload   = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = createHash("sha256")
      .update(payload + API_SECRET)
      .digest("hex");

    const body = new URLSearchParams({
      public_id: publicId,
      api_key:   API_KEY,
      timestamp,
      signature,
    });

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      { method: "POST", body }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Cloudinary] destroy failed:", err);
    }
  } catch (error) {
    console.error("[Cloudinary] deleteFromCloudinary error:", error);
  }
}

/**
 * 여러 URL에서 public_id를 추출하여 일괄 삭제
 */
export async function deleteImagesByUrls(urls: string[]): Promise<void> {
  const tasks = urls
    .map(extractPublicId)
    .filter((id): id is string => id !== null)
    .map(deleteFromCloudinary);

  await Promise.allSettled(tasks);
}
