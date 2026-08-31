import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/github";
import { OgFrame, clampText, loadOgFonts } from "@/og/frame";

/**
 * Image OpenGraph d'une fiche projet — cote PRJ, nom du dépôt, description
 * GitHub. Suit l'ISR de la page (rythme du registre GitHub).
 */
export const alt = "Projet du registre de Daniel CHABI BOUKO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  const fonts = await loadOgFonts();

  return new ImageResponse(
    project ? (
      <OgFrame
        kicker={`${project.cote} — PROJET`}
        title={project.name}
        subtitle={clampText(project.description, 165)}
        footer={
          project.primaryLanguage
            ? `GitHub · ${project.primaryLanguage}`
            : "GitHub · DanitechChabi"
        }
      />
    ) : (
      <OgFrame
        kicker="PRJ·2026 — REGISTRE DES PROJETS"
        title="Projet introuvable"
        subtitle="Cette fiche n'est pas ou plus versée au registre."
        footer="GitHub · DanitechChabi"
      />
    ),
    { ...size, fonts },
  );
}
