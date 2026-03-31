export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount?: number;
  friendCount?: number;
}

export interface Post {
  id: string;
  content: string;
  visibility?: string;
  createdAt: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount?: number;
}

export interface Friend {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}
