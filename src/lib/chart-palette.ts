import type { LanguageShare } from "@/lib/github";

/**
 * Palette des graphiques — « Le Registre ».
 *
 * Une teinte par famille d'encre du site (ocre, cyanotype, vert, prune,
 * vermillon) + taupe pour « Autre ». La couleur suit l'entité (le
 * langage), jamais son rang : un langage garde la même teinte d'un
 * projet à l'autre.
 *
 * Ces valeurs sont des paliers AJUSTÉS (clarté, chroma) des encres de
 * la DA — les teintes (hue) d'origine sont conservées, mais les paliers
 * bruts des tokens UI ne passent pas les contrôles dataviz (bande de
 * clarté, plancher de chroma, séparation CVD, plancher vision normale).
 * Les tokens UI (`accent`, `cyan`, `green`…) restent eux à leurs valeurs
 * DA : ils servent de texte, pas de séries.
 *
 * ⚠ VALIDATION — relancer après toute retouche :
 *
 *   npm run palette:check        (six contrôles, mode all-pairs)
 *
 * Pour recalibrer : node scripts/search_palette.mjs — cherche, teintes
 * conservées, la combinaison la plus proche qui passe tout.
 */

export const CHART_SURFACE = "#faf7ec"; // surface « feuille claire »

/** Ordre fixe d'attribution — jamais cyclé. Validée dataviz (all-pairs). */
export const SERIES = ["#a06b1a", "#11558c", "#228861", "#9265a8", "#971e00"] as const;

/** Catégorie repli (« Autre ») — neutre, jamais une 6e teinte. */
export const OTHER_COLOR = "#877d63";

/* ------------------------------------------------------------------ */
/* Association langage → teinte                                        */
/* ------------------------------------------------------------------ */

/**
 * Table fixe, alignée autant que possible sur les couleurs habituelles
 * des langages (JS jaune, TS bleu, CSS pourpre, HTML orangé, Python
 * vert) pour raccourcir la lecture.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#a06b1a",
  TypeScript: "#11558c",
  CSS: "#9265a8",
  HTML: "#971e00",
  Python: "#228861",
  Java: "#9265a8",
  Shell: "#877d63",
  Dockerfile: "#11558c",
};

/**
 * Couleurs d'une barre de langages : la table fixe d'abord, puis les
 * creux remplis dans l'ordre de SERIES (déterministe, sans doublon dans
 * une même barre). « Autre » reste taupe en toutes circonstances.
 */
export function colorsForLanguages(languages: LanguageShare[]): string[] {
  const used = new Set<string>();
  const colors = languages.map((l) => {
    if (l.name === "Autre") return OTHER_COLOR;
    const known = LANGUAGE_COLORS[l.name];
    if (known && !used.has(known)) {
      used.add(known);
      return known;
    }
    const free = SERIES.find((c) => !used.has(c)) ?? OTHER_COLOR;
    used.add(free);
    return free;
  });
  return colors;
}

/** « 12 480 octets » — séparateur fin français. */
export function formatBytes(bytes: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(bytes)} octets`;
}

/** Part en pourcents arrondie (62 %). */
export function formatShare(share: number): string {
  return `${Math.round(share * 100)} %`;
}
