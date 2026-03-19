import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

/**
 * 초대 코드 포맷: COTERIE-XXXXXXXX (대문자 8자리)
 */
function generateInviteCode(): string {
  const raw = createId().toUpperCase().slice(0, 8);
  return `COTERIE-${raw}`;
}

/**
 * 유저에게 초대 코드 생성
 * - 이메일 인증 완료 시: count = 3 (기본값)
 * - 관리자가 수동 발급 시: count 지정 가능
 */
export async function createInviteCodesForUser(
  userId: string,
  count = 3
): Promise<{ code: string }[]> {
  const codes = Array.from({ length: count }, () => ({
    code: generateInviteCode(),
    ownerId: userId,
  }));

  await prisma.inviteCode.createMany({ data: codes });

  return codes.map((c) => ({ code: c.code }));
}
