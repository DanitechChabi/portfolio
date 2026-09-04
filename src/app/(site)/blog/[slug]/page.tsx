import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/data";
import { Markdown } from "@/components/blog/Markdown";
import { Reveal } from "@/components/ui/Reveal";
import { formatDate, readingTime } from "@/lib/format";
import { ArrowLeftIcon, CalendarIcon } from "@/components/ui/icons";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at ?? post.created_at,
      // Pas d'images ici : la fiche de partage est générée par
      // opengraph-image.tsx (cadre « Le Registre », titre de l'article).
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const posts = await getPublishedPosts();
  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="container-site">
        <Reveal>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-ink-dim transition-colors hover:text-accent-soft"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tous les articles
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <header className="mx-auto mt-10 max-w-3xl text-center">
            <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <CalendarIcon className="h-3.5 w-3.5 text-accent/70" />
              {formatDate(post.published_at ?? post.created_at)} ·{" "}
              {readingTime(post.content)}
            </p>
            <h1 className="wonk mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
              {post.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-dim md:text-lg">
              {post.excerpt}
            </p>
          </header>
        </Reveal>

        {post.cover_image_url && (
          <Reveal delay={0.1} className="mx-auto mt-12 max-w-4xl">
            <div className="overflow-hidden border border-ink/25 shadow-card">
              <Image
                src={post.cover_image_url}
                alt={`Illustration de « ${post.title} »`}
                width={1200}
                height={630}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </Reveal>
        )}

        <Reveal delay={0.12} className="mx-auto mt-14 max-w-2xl">
          <Markdown content={post.content} />
        </Reveal>

        {/* Séparateur */}
        <div className="mx-auto mt-16 flex max-w-2xl items-center gap-6" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
          <span className="font-serif text-2xl italic text-accent/50">D.</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
        </div>

        {/* À lire ensuite */}
        {others.length > 0 && (
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="font-serif text-xl text-ink">À lire ensuite</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={`/blog/${other.slug}`}
                  className="group block border border-ink/25 bg-surface p-6 transition-colors duration-300 hover:border-accent/50"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    {formatDate(other.published_at ?? other.created_at)}
                  </p>
                  <h3 className="mt-2 font-serif text-lg leading-snug text-ink transition-colors group-hover:text-accent-soft">
                    {other.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
