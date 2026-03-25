-- 대댓글(replies)의 parentId 외래키에 ON DELETE CASCADE 추가
-- 부모 댓글이 삭제될 때 대댓글도 함께 삭제되도록 처리

ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_parentId_fkey";

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_parentId_fkey"
  FOREIGN KEY ("parentId")
  REFERENCES "Comment"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
