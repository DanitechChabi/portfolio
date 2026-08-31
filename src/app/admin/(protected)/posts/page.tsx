import Link from "next/link";
import { getAllPosts } from "@/lib/data";
import { AdminHeading, Card } from "@/components/admin/form-ui";
import { PostRow } from "@/components/admin/PostRow";
import { PlusIcon } from "@/components/ui/icons";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <AdminHeading
        title="Articles"
        description={`${posts.length} article${posts.length > 1 ? "s" : ""} — brouillons et publiés.`}
        actions={
          <Link
            href="/admin/posts/nouveau"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg-deep transition-colors hover:bg-accent-soft"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvel article
          </Link>
        }
      />

      {posts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-dim">
          Aucun article pour le moment — écrivez le premier.
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostRow post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
