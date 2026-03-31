-- Add user soft-delete field to Post
ALTER TABLE "Post" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create Report enums
CREATE TYPE "ReportTarget" AS ENUM ('POST', 'COMMENT');
CREATE TYPE "ReportReason" AS ENUM ('SEXUAL_CONTENT', 'HATE_SPEECH', 'SPAM', 'VIOLENCE', 'PRIVACY_VIOLATION', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTIONED');

-- Create Report table
CREATE TABLE "Report" (
  "id"           TEXT NOT NULL,
  "reporterId"   TEXT NOT NULL,
  "targetType"   "ReportTarget" NOT NULL,
  "targetId"     TEXT NOT NULL,
  "reason"       "ReportReason" NOT NULL,
  "status"       "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "resolvedAt"   TIMESTAMP(3),
  "resolvedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one report per user per target
CREATE UNIQUE INDEX "Report_reporterId_targetType_targetId_key"
  ON "Report"("reporterId", "targetType", "targetId");

-- FK: reporterId → User.id
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
