-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FRIENDS');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FRIEND_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'FRIEND_ACCEPT';

-- AlterTable: Post add visibility column
ALTER TABLE "Post" ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable: Notification add friendshipId column
ALTER TABLE "Notification" ADD COLUMN "friendshipId" TEXT;

-- CreateTable: Friendship
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
