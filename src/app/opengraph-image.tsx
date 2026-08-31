import { ImageResponse } from "next/og";
import { OgFrame, loadOgFonts } from "@/og/frame";

/**
 * Image OpenGraph racine — la fiche de partage pour l'accueil et toute
 * page sans image dédiée (WhatsApp, LinkedIn, X, Facebook… lisent
 * `og:image` et produisent l'aperçu enrichi).
 */
export const alt =
  "Daniel CHABI BOUKO — archiviste 2.0, développeur web et data analyst à Cotonou";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgFrame
      kicker="DCB·2026·F°01 — REGISTRE PERSONNEL"
      title="Daniel Chabi Bouko"
      subtitle="Archiviste 2.0 · Développeur web · Data analyst — des outils qui optimisent la gestion de l'information, du fonds d'archives au tableau de bord."
      footer="Cotonou · Bénin"
    />,
    { ...size, fonts: await loadOgFonts() },
  );
}
