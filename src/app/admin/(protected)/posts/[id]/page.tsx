import { notFound } from "next/navigation";
import { getPostById } from "@/lib/data";
import { PostForm } from "@/components/admin/PostForm";

type Props = { params: Promise<{ id: string }> };

/**
 * /admin/posts/nouveau → création.
 * /admin/posts/7       → modification.
 */
export default async function AdminPostEditPage({ params }: Props) {
  const { id } = await params;

  if (id === "nouveau") {
    return <PostForm />;
  }

  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  return <PostForm post={post} />;
}
