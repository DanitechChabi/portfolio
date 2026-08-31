import { ImageResponse } from "next/og";
import { OgFrame, loadOgFonts } from "@/og/frame";

/**
 * Image OpenGraph du blog — même charte que l'accueil, cote BLG.
 */
export const alt = "Blog de Daniel CHABI BOUKO — Chroniques d'un archiviste 2.0";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgFrame
      kicker="BLG·2026·01 — CHRONIQUES"
      title="Chroniques d'un archiviste 2.0"
      subtitle="GED, dématérialisation, archives numériques, développement web et analyse de données — méthodes, outils et retours d'expérience."
      footer="Notes de travail"
    />,
    { ...size, fonts: await loadOgFonts() },
  );
}
