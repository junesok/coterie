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
 * 이메일 인증 완료 시 유저에게 초대 코드 3개 자동 생성
 */
export async function createInviteCodesForUser(userId: string): Promise<void> {
  const codes = Array.from({ length: 3 }, () => ({
    code: generateInviteCode(),
    ownerId: userId,
  }));

  await prisma.inviteCode.createMany({ data: codes });
}
