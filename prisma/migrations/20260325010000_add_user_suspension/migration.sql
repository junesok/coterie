-- 계정 정지 필드 추가
ALTER TABLE "User"
  ADD COLUMN "isSuspended"     BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "suspendedAt"     TIMESTAMP,
  ADD COLUMN "suspendedReason" TEXT;

-- ModerationTarget enum에 USER 추가
ALTER TYPE "ModerationTarget" ADD VALUE IF NOT EXISTS 'USER';
