-- CreateEnum
CREATE TYPE "ModerationTarget" AS ENUM ('POST', 'COMMENT');

-- CreateEnum
CREATE TYPE "ModerationReason" AS ENUM ('SEXUAL_CONTENT', 'HATE_SPEECH', 'SPAM', 'VIOLENCE', 'PRIVACY_VIOLATION', 'OTHER');

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ModerationReason" NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
