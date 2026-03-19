/**
 * 관리자 계정 seed 스크립트 (Neon HTTP transport 사용)
 * 실행: npx tsx prisma/seed-admin.ts
 *
 * 환경변수 필요:
 *   DATABASE_URL — Neon PostgreSQL 연결 문자열
 *   ADMIN_PASSWORD — 관리자 비밀번호 (필수)
 */
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL!);

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const now = new Date().toISOString();

  // 기존 admin 계정 확인
  const existing = await sql`
    SELECT id FROM "User" WHERE username = 'coterie_admin' LIMIT 1
  `;

  if (existing.length > 0) {
    // 업데이트
    await sql`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}, "isAdmin" = true, "isVerified" = true
      WHERE username = 'coterie_admin'
    `;
    console.log(`✅ 관리자 계정 업데이트 완료: coterie_admin`);
  } else {
    // 신규 생성
    const id = createId();
    await sql`
      INSERT INTO "User" (id, email, username, name, "passwordHash", "isVerified", "isAdmin", "createdAt")
      VALUES (
        ${id},
        'admin@coterie.internal',
        'coterie_admin',
        '관리자',
        ${passwordHash},
        true,
        true,
        ${now}
      )
    `;
    console.log(`✅ 관리자 계정 생성 완료: coterie_admin (id: ${id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
