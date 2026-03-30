-- Post: isHidden, hiddenAt 추가
ALTER TABLE "Post" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- Comment: isHidden, hiddenAt 추가
ALTER TABLE "Comment" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- ModerationLog: action 추가, reason 을 nullable로 변경
ALTER TABLE "ModerationLog" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'DELETE';
ALTER TABLE "ModerationLog" ALTER COLUMN "reason" DROP NOT NULL;
