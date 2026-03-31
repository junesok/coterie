export type Tab = "likes" | "comments";

export type LikeItem = {
  id: string;
  post: {
    id: string;
    content: string;
    visibility: string;
    createdAt: string;
    author: { id: string; username: string | null; name: string; avatarUrl: string | null };
    images: { url: string; order: number }[];
    _count: { likes: number; comments: number };
  };
};

export type CommentItem = {
  id: string;
  content: string | null;
  createdAt: string;
  post: {
    id: string;
    content: string;
    author: { username: string | null; avatarUrl: string | null };
    images?: { url: string; order: number }[];
  };
};
