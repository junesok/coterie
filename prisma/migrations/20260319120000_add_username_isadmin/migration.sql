-- AlterTable: username 컬럼 추가 (nullable로 추가 후 기존 유저 자동 할당)
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- 기존 유저: email 앞부분을 username으로 자동 할당
-- 유효하지 않은 문자 제거 후 소문자 처리, 중복 방지를 위해 ID 앞 4자리 붙임
UPDATE "User"
SET "username" = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '_', 'gi'))
WHERE "username" IS NULL;

-- username 중복 방지: 동일 값이 있을 경우 _XXXX 접미사 추가
WITH duplicates AS (
  SELECT id, username,
    ROW_NUMBER() OVER (PARTITION BY username ORDER BY "createdAt") AS rn
  FROM "User"
  WHERE username IS NOT NULL
)
UPDATE "User" u
SET username = d.username || '_' || SUBSTRING(u.id FROM 1 FOR 4)
FROM duplicates d
WHERE u.id = d.id AND d.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
