-- Add deletedAt field to User for soft-delete (account withdrawal with 30-day grace period)
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
