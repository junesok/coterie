export type Tab = "all" | "friends";
export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export interface Post {
  id: string;
  content: string;
  visibility: string;
  createdAt: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount?: number;
}

export interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  friendStatus: FriendStatus;
  friendshipId: string | null;
}
