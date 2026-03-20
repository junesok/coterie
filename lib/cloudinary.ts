import { createHash } from "crypto";

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY     = process.env.CLOUDINARY_API_KEY!;
const API_SECRET  = process.env.CLOUDINARY_API_SECRET!;

/**
 * Cloudinary URL에서 public_id 추출
 * 예) https://res.cloudinary.com/dwhsrs6bj/image/upload/q_auto,f_auto/coterie/abc123.jpg
 *  → coterie/abc123
 */
export function extractPublicId(url: string): string | null {
  try {
    // /upload/ 이후의 경로에서 버전(v1234567/)과 변환(q_auto,f_auto/) 제거
    const match = url.match(/\/upload\/(?:(?:v\d+|[a-z_,]+:[a-zA-Z0-9]+(?:,[a-z_,]+:[a-zA-Z0-9]+)*)\/)*(.+?)(?:\.[a-z]+)?$/);
    if (!match) return null;
    return match[1]; // ex) "coterie/abc123"
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
