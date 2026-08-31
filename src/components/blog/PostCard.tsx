import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types/content";
import { formatDate, readingTime } from "@/lib/format";
import { Parallax } from "@/components/ui/Parallax";
import { ArrowUpRightIcon, CalendarIcon } from "@/components/ui/icons";

type PostCardProps = {
  post: Post;
  /** Article mis en avant (liste du blog). */
  featured?: boolean;
};

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block focus-visible:outline-2"
      aria-label={`Lire l'article : ${post.title}`}
    >
      <article
        className={`h-full overflow-hidden border border-ink/25 bg-surface shadow-card transition-colors duration-500 hover:border-accent/50 ${
          featured ? "grid md:grid-cols-2" : ""
        }`}
      >
        {/* Visuel : image de couverture ou composition typographique */}
        <div className={`relative overflow-hidden ${featured ? "min-h-56" : "h-44"}`}>
          {post.cover_image_url ? (
            <Parallax amount={featured ? 20 : 14} className="absolute inset-0">
              <Image
                src={post.cover_image_url}
                alt={`Illustration de « ${post.title} »`}
                width={960}
                height={540}
                className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] ${
                  featured ? "scale-[1.14]" : "scale-[1.18]"
                }`}
              />
            </Parallax>
          ) : (
            <Parallax amount={featured ? 18 : 12} className="absolute inset-0">
              <div className="bg-graph relative flex h-full w-full items-center justify-center">
                <span
                  className="font-serif text-[9rem] italic leading-none text-accent/15 transition-colors duration-500 group-hover:text-accent/30"
                  aria-hidden
                >
                  ”
                </span>
                <div
                  className="absolute inset-x-8 bottom-6 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
                  aria-hidden
                />
              </div>
            </Parallax>
          )}
          <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-ink/30 bg-bg/85 text-ink opacity-0 transition-all duration-300 group-hover:opacity-100">
            <ArrowUpRightIcon className="h-4 w-4" />
          </span>
        </div>

        {/* Texte */}
        <div className={`p-6 ${featured ? "md:p-9" : ""}`}>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            <CalendarIcon className="h-3.5 w-3.5 text-accent/70" />
            {formatDate(post.published_at ?? post.created_at)} ·{" "}
            {readingTime(post.content)}
          </p>
          <h3
            className={`mt-3 font-serif leading-snug tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-soft ${
              featured ? "text-2xl md:text-3xl" : "text-xl"
            }`}
          >
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-dim">
            {post.excerpt}
          </p>
        </div>
      </article>
    </Link>
  );
}
