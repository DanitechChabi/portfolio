import { readFile } from "node:fs/promises";
import type { ReactElement } from "react";

/**
 * Cadre commun des images OpenGraph (partage de liens) — la charte
 * « Le Registre » en 1200×630 : papier ivoire, double filet d'encre,
 * cote en mono, sceau vermillon et bandeau de pied. Rendu par Satori
 * (`next/og`), qui n'accepte que des polices statiques : les TTF sont
 * embarqués dans le repo (sous-ensembles latin, licence SIL OFL — voir
 * fonts/LICENSE.txt).
 *
 * Contraintes Satori : flexbox uniquement, pas d'ombre de boîte — les
 * reliefs se font aux filets, dégradés et rotations.
 */

/* ---- Palette (miroir de globals.css, en dur : pas de vars CSS ici) ---- */
export const OG_COLORS = {
  paper: "#f2ede0",
  surface: "#faf7ef",
  ink: "#211c13",
  inkDim: "#5d564a",
  inkFaint: "#8a8172",
  accent: "#c0391b",
  accentDeep: "#9c2e14",
  cyan: "#2c4e6e",
  green: "#2f5d48",
} as const;

const { paper, ink, inkDim, inkFaint, accent, cyan, green } = OG_COLORS;

/* ---- Polices : chargées une fois, mises en cache au niveau module ---- */

/* Graisses acceptées par Satori (union littérale, cf. FontOptions). */
type OgWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type FontDescriptor = {
  name: string;
  data: Buffer;
  weight: OgWeight;
  style: "normal" | "italic";
};

let fontsPromise: Promise<FontDescriptor[]> | null = null;

/** Les six polices, prêtes pour l'option `fonts` de `ImageResponse`. */
export function loadOgFonts(): Promise<FontDescriptor[]> {
  /* Lectures statiques (chemins littéraux) : le bundler trace chaque
     TTF vers le build — pas d'accès dynamique au filesystem. */
  fontsPromise ??= Promise.all([
    readFile(new URL("./fonts/fraunces-600.ttf", import.meta.url)),
    readFile(new URL("./fonts/fraunces-600-italic.ttf", import.meta.url)),
    readFile(new URL("./fonts/plex-mono-400.ttf", import.meta.url)),
    readFile(new URL("./fonts/plex-mono-500.ttf", import.meta.url)),
    readFile(new URL("./fonts/plex-sans-400.ttf", import.meta.url)),
    readFile(new URL("./fonts/plex-sans-500.ttf", import.meta.url)),
  ]).then(
    ([
      fraunces,
      frauncesItalic,
      mono400,
      mono500,
      sans400,
      sans500,
    ]): FontDescriptor[] => [
      { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
      { name: "Fraunces", data: frauncesItalic, weight: 600, style: "italic" },
      { name: "Plex Mono", data: mono400, weight: 400, style: "normal" },
      { name: "Plex Mono", data: mono500, weight: 500, style: "normal" },
      { name: "Plex Sans", data: sans400, weight: 400, style: "normal" },
      { name: "Plex Sans", data: sans500, weight: 500, style: "normal" },
    ],
  ).catch((e) => {
    fontsPromise = null; // échec transitoire : on retentera au prochain rendu
    throw e;
  });
  return fontsPromise;
}

/* ---- Aides ---- */

/** Coupe proprement à ~n caractères sur une limite de mot. */
export function clampText(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : max)}…`;
}

/** Corps du titre selon sa longueur — deux lignes au plus en pratique. */
export function titleSize(title: string): number {
  const len = title.length;
  if (len > 64) return 48;
  if (len > 40) return 62;
  if (len > 24) return 76;
  return 88;
}

/* ---- Le sceau — tampon vermillon, monogramme au centre ---- */

function Seal({ size = 150 }: { size?: number }) {
  const ring = { display: "flex", alignItems: "center", justifyContent: "center" } as const;
  return (
    <div
      style={{
        ...ring,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `4px solid ${accent}`,
        transform: "rotate(-12deg)",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          ...ring,
          flexDirection: "column",
          width: size - 26,
          height: size - 26,
          borderRadius: "50%",
          border: `2px solid ${accent}`,
        }}
      >
        <span
          style={{
            fontFamily: "Plex Mono",
            fontSize: size * 0.085,
            letterSpacing: size * 0.02,
            color: accent,
          }}
        >
          PORTFOLIO
        </span>
        <span
          style={{
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontSize: size * 0.34,
            color: accent,
            marginTop: -size * 0.02,
          }}
        >
          DCB
        </span>
        <span
          style={{
            fontFamily: "Plex Mono",
            fontSize: size * 0.085,
            letterSpacing: size * 0.03,
            color: accent,
          }}
        >
          MMXXVI
        </span>
      </div>
    </div>
  );
}

/* ---- Le cadre ---- */

export type OgFrameProps = {
  /** Ligne d'en-tête mono — cote + intitulé (ex. « DCB·2026·F°01 — REGISTRE »). */
  kicker: string;
  /** Titre principal (Fraunces). */
  title: string;
  /** Sous-titre descriptif (Plex Sans). */
  subtitle: string;
  /** Mention de pied, à droite (date, lieu…). */
  footer?: string;
  /** Trois carrés de casquette au pied ? (défaut : oui) */
  hats?: boolean;
};

/**
 * Fiche 1200×630 : double filet, cote, titre, sous-titre, sceau en haut à
 * droite, étiquette verticale « LE REGISTRE » et pied de registre.
 */
export function OgFrame({ kicker, title, subtitle, footer, hats = true }: OgFrameProps): ReactElement {
  const size = titleSize(title);

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        backgroundColor: paper,
        color: ink,
      }}
    >
      {/* Vignette légère — le papier respire vers les bords */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(ellipse 130% 100% at 50% 42%, rgba(0,0,0,0) 55%, rgba(33,28,19,0.14) 100%)`,
        }}
      />

      {/* Double filet d'encre */}
      <div style={{ display: "flex", position: "absolute", left: 26, top: 26, right: 26, bottom: 26, border: `3px solid ${ink}` }} />
      <div style={{ display: "flex", position: "absolute", left: 36, top: 36, right: 36, bottom: 36, border: `1px solid rgba(33,28,19,0.45)` }} />

      {/* Sceau */}
      <div style={{ display: "flex", position: "absolute", top: 64, right: 88 }}>
        <Seal size={148} />
      </div>

      {/* Étiquette verticale — tranche de registre */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 52,
          top: 315,
          transform: "rotate(90deg)",
          fontFamily: "Plex Mono",
          fontSize: 21,
          letterSpacing: 10,
          color: accent,
          opacity: 0.85,
        }}
      >
        LE REGISTRE
      </div>

      {/* Colonne de contenu */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 92,
          width: 870,
          height: 446,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cote */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 34, height: 4, backgroundColor: accent }} />
          <span
            style={{
              fontFamily: "Plex Mono",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 5,
              color: accent,
            }}
          >
            {kicker}
          </span>
        </div>

        {/* Titre */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 38,
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: size,
            lineHeight: 1.04,
            color: ink,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        {/* Filet vermillon sous le titre */}
        <div style={{ display: "flex", marginTop: 34, width: 210, height: 4, backgroundColor: accent }} />

        {/* Sous-titre */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 26,
            fontFamily: "Plex Sans",
            fontSize: 29,
            lineHeight: 1.42,
            color: inkDim,
            maxWidth: 830,
          }}
        >
          {subtitle}
        </div>

        {/* Pied de registre */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", width: 870 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {hats && (
              <div style={{ display: "flex", gap: 10 }}>
                {/* Une encre par casquette — losanges inclinés */}
                {[accent, cyan, green].map((c) => (
                  <div key={c} style={{ display: "flex", width: 13, height: 13, backgroundColor: c, transform: "rotate(45deg)" }} />
                ))}
              </div>
            )}
            <span style={{ fontFamily: "Plex Mono", fontSize: 23, letterSpacing: 2, color: ink }}>
              danielchabi.vercel.app
            </span>
          </div>
          {footer && (
            <span style={{ fontFamily: "Plex Mono", fontSize: 20, letterSpacing: 3, color: inkFaint }}>
              {footer.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
