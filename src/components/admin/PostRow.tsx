"use client";

import { useRouter } from "next/navigation";
import type { Post } from "@/types/content";
import { formatDate } from "@/lib/format";
import { Card } from "./form-ui";

export function PostRow({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <Card className="group flex flex-wrap items-center gap-x-4 gap-y-2 p-5 transition-colors duration-300 hover:border-accent/40">
      <button
        type="button"
        onClick={() => router.push(`/admin/posts/${post.id}`)}
        className="min-w-0 flex-1 text-left"
        aria-label={`Modifier « ${post.title} »`}
      >
        <p className="flex flex-wrap items-center gap-2.5">
          <span className="font-serif text-lg leading-snug text-ink">
            {post.title}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              post.published
                ? "border-accent/40 bg-accent/10 text-accent-soft"
                : "border-line bg-surface-2 text-ink-faint"
            }`}
          >
            {post.published ? "Publié" : "Brouillon"}
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          /blog/{post.slug} · {formatDate(post.published_at ?? post.created_at)}
        </p>
      </button>

      {post.published && (
        <a
          href={`/blog/${post.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-dim transition-colors hover:border-accent/50 hover:text-accent"
        >
          Voir en ligne
        </a>
      )}
    </Card>
  );
}
