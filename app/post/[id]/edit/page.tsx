"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PostForm } from "@/components/PostForm";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [initialImages, setInitialImages] = useState<string[]>([]);
  const [initialVisibility, setInitialVisibility] = useState<"PUBLIC" | "FRIENDS">("PUBLIC");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/posts/${id}`).then((res) => {
      if (res.data.success) {
        const post = res.data.post;
        // 본인 확인
        if (post.author.id !== session?.user?.id) {
          router.replace(`/post/${id}`);
          return;
        }
        setInitialContent(post.content);
        setInitialImages(post.images.map((img: { url: string }) => img.url));
        setInitialVisibility(post.visibility === "FRIENDS" ? "FRIENDS" : "PUBLIC");
      }
    }).finally(() => setLoading(false));
  }, [id, session, router]);

  if (loading) return (
    <p className="text-center mt-8 text-sm" style={{ color: "var(--text-sub)" }}>Loading...</p>
  );

  if (initialContent === null) return null;

  return (
    <PostForm
      initialContent={initialContent}
      initialImages={initialImages}
      initialVisibility={initialVisibility}
      postId={id}
    />
  );
}
