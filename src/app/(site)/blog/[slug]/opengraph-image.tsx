import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { OgFrame, clampText, loadOgFonts } from "@/og/frame";

/**
 * Image OpenGraph d'un article — le titre de la fiche en Fraunces,
 * le chapeau en sous-titre, la date en pied. Suit l'ISR de la page.
 */
export const alt = "Article du blog de Daniel CHABI BOUKO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const fonts = await loadOgFonts();

  return new ImageResponse(
    post ? (
      <OgFrame
        kicker={`BLG·2026 — ${formatDate(post.published_at ?? post.created_at)}`}
        title={post.title}
        subtitle={clampText(post.excerpt, 165)}
        footer="Chroniques d'un archiviste 2.0"
      />
    ) : (
      <OgFrame
        kicker="BLG·2026 — CHRONIQUES"
        title="Article introuvable"
        subtitle="Cette fiche n'est pas ou plus versée au registre."
        footer="Chroniques d'un archiviste 2.0"
      />
    ),
    { ...size, fonts },
  );
}
