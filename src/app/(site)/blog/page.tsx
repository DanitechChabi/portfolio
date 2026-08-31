import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Réflexions d'un archiviste 2.0 : GED, dématérialisation, archives numériques, développement web et analyse de données.",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const [firstPost, ...rest] = posts;

  return (
    <div className="relative pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            cote="BLG·2026·01"
            title="Chroniques d'un archiviste 2.0"
            note="Notes de travail, versées au fonds au fil des chantiers."
            description="Le métier d'archiviste à l'ère numérique : méthodes, outils, retours d'expérience — et quelques convictions."
          />
        </Reveal>

        {posts.length === 0 ? (
          <Reveal className="mt-14">
            <p className="border border-ink/20 bg-surface p-10 text-center text-ink-dim">
              Les premiers articles arrivent bientôt.
            </p>
          </Reveal>
        ) : (
          <div className="mt-14 space-y-6">
            {firstPost && (
              <Reveal>
                <PostCard post={firstPost} featured />
              </Reveal>
            )}
            {rest.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {rest.map((post, i) => (
                  <Reveal key={post.id} delay={0.05 * (i % 2)}>
                    <PostCard post={post} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
