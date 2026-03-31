export interface Post {
  id: string;
  content: string;
  createdAt: string;
  visibility: "PUBLIC" | "FRIENDS";
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  images: { url: string; order: number }[];
  _count: { comments: number };
  likeCount: number;
  isLiked: boolean;
}
