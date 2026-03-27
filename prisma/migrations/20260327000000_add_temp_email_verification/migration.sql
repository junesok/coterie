-- CreateTable: 가입 전 이메일 인증용 임시 테이블
CREATE TABLE "TempEmailVerification" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "verified"  BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempEmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TempEmailVerification_email_idx" ON "TempEmailVerification"("email");
