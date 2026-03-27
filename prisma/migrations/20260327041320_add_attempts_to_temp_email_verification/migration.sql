-- AlterTable
ALTER TABLE "TempEmailVerification" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "suspendedAt" SET DATA TYPE TIMESTAMP(3);
