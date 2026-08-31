/**
 * Cherche la palette catégorielle « Le Registre » la plus proche des encres
 * d'origine qui passe les six contrôles du validateur dataviz.
 *
 * Méthode — rien n'est estimé :
 * - chaque famille garde la TEINTE (hue OKLCH) exacte de son encre d'origine ;
 * - seules la clarté (L) et la chroma (C) sont balayées par pas réguliers ;
 * - chaque candidat est converti OKLCH → hex, puis re-mesuré hex → OKLCH :
 *   un aller-retour imprécis (hors gamut) élimine le candidat ;
 * - les seuils appliqués pendant la recherche sont ceux du validateur
 *   (importé : même math, mêmes constantes) ;
 * - le DFS teste les candidates de la plus proche à la plus lointaine de
 *   l'originale : le résultat est la combinaison de déviation minimale.
 *
 * Usage : node scripts/search_palette.mjs
 */

import { validate } from "./validate_palette.mjs";

const ORIGINALS = [
  { name: "ocre", hex: "#a06b1a" },       // JavaScript
  { name: "cyanotype", hex: "#2c4e6e" },  // TypeScript / série data
  { name: "vert", hex: "#2f5d48" },       // Python
  { name: "prune", hex: "#6d4f7c" },      // CSS
  { name: "vermillon", hex: "#c0391b" },  // HTML
];
const SURFACE = "#faf7ec";

/* --- Math identique au validateur (copiée telle quelle) ------------------- */

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868],
           [0.114503, 0.786281, 0.099216],
           [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968],
           [0.280085, 0.672501, 0.047413],
           [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779],
           [-0.078411, 0.930809, 0.147602],
           [0.004733, 0.691367, 0.303900]],
};

const hex2srgb = (h) => { h = h.trim().replace(/^#/, ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
const s2lin = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lin = (h) => hex2srgb(h).map(s2lin);
const relLum = (h) => { const [r, g, b] = lin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

function oklabFromLin([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
const oklab = (h) => oklabFromLin(lin(h));
const oklch = (h) => { const [L, a, b] = oklab(h); return [L, Math.hypot(a, b)]; };
const okhue = (h) => { const [, a, b] = oklab(h); return ((Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360; };

function simulate(h, kind) {
  const [r, g, b] = lin(h), M = MACHADO[kind];
  const clamp = (c) => Math.max(0, Math.min(1, c));
  return [
    clamp(M[0][0] * r + M[0][1] * g + M[0][2] * b),
    clamp(M[1][0] * r + M[1][1] * g + M[1][2] * b),
    clamp(M[2][0] * r + M[2][1] * g + M[2][2] * b),
  ];
}
function deltaE(h1, h2, kind) {
  const a = oklabFromLin(kind ? simulate(h1, kind) : lin(h1));
  const b = oklabFromLin(kind ? simulate(h2, kind) : lin(h2));
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/* --- Inverse OKLCH → sRGB hex (Björn Ottosson) ---------------------------- */

function oklchToHex(L, C, H) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const lin2s = (c) => {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  const to255 = (c) => Math.round(Math.max(0, Math.min(255, lin2s(c) * 255)));
  return "#" + [R, G, B].map((c) => to255(c).toString(16).padStart(2, "0")).join("");
}

/* --- Candidats par famille : même teinte, L et C balayés ------------------ */

const families = ORIGINALS.map(({ name, hex }) => {
  const [L0, C0] = oklch(hex);
  const H = okhue(hex);
  const candidates = [];

  /* L'originale n'est candidate que si elle passe déjà les contrôles
     par-couleur (bande de clarté, plancher de chroma, contraste). */
  const originalOk =
    L0 >= 0.43 && L0 <= 0.77 && C0 >= 0.10 && contrast(hex, SURFACE) >= 3.0;
  if (originalOk) candidates.push({ hex, dist: 0, note: "originale" });

  for (let L = 0.44; L <= 0.68 + 1e-9; L += 0.02) {
    for (let C = 0.10; C <= 0.16 + 1e-9; C += 0.01) {
      if (Math.abs(L - L0) < 0.011 && Math.abs(C - C0) < 0.011) continue;
      const candidate = oklchToHex(L, C, H);
      /* Aller-retour : si la re-mesure s'écarte de la cible, le candidat
         est hors gamut — on ne garde que ce qui se convertit proprement.
         Marges 0.432 / 0.102 : la quantification 8 bits du hex peut faire
         retomber la mesure juste SOUS un plancher (bande, chroma). */
      const [Lr, Cr] = oklch(candidate);
      if (Math.abs(Lr - L) > 0.01 || Math.abs(Cr - C) > 0.01) continue;
      if (Lr < 0.432 || Cr < 0.102) continue;
      if (contrast(candidate, SURFACE) < 3.0) continue;
      candidates.push({ hex: candidate, dist: deltaE(hex, candidate) });
    }
  }

  candidates.sort((x, y) => x.dist - y.dist);
  return { name, original: hex, H, candidates };
});

/* --- Recherche DFS : déviation minimale, seuils du validateur ------------- */

const pairOk = (h1, h2) =>
  deltaE(h1, h2) >= 15 &&
  Math.min(deltaE(h1, h2, "protan"), deltaE(h1, h2, "deutan")) >= 8;

function search(pairsMode) {
  const picked = [];
  let nodes = 0;
  const BUDGET = 5e6;

  function dfs(i) {
    if (i === families.length) return true;
    for (const cand of families[i].candidates) {
      if (++nodes > BUDGET) return false;
      const ok = picked.every((p, j) => {
        const mustCheck = pairsMode === "all" || j === i - 1;
        return !mustCheck || pairOk(p.hex, cand.hex);
      });
      if (!ok) continue;
      picked.push(cand);
      if (dfs(i + 1)) return true;
      picked.pop();
    }
    return false;
  }

  return dfs(0) ? picked.map((p) => p.hex) : null;
}

/* --- Exécution ------------------------------------------------------------- */

console.log("\nRecherche d'une palette « Le Registre » validée (teintes conservées) :");
for (const f of families) {
  const [L, C] = oklch(f.original);
  console.log(
    `  ${f.name.padEnd(11)} ${f.original}  hue ${f.H.toFixed(0)}°, L ${L.toFixed(3)}, C ${C.toFixed(3)}  — ${f.candidates.length} candidats`,
  );
}

/* Mode « all » d'abord : dans la barre de langages, deux teintes quelconques
   peuvent se retrouver adjacentes (l'ordre suit les octets, pas la série). */
const palette = search("all") ?? search("adjacent");

if (!palette) {
  console.error("\nAucune combinaison ne passe — élargir la grille L/C ou espacer les teintes.");
  process.exit(1);
}

console.log("\nPalette trouvée (déviation minimale) :\n");
ORIGINALS.forEach((f, i) => {
  const [L, C] = oklch(palette[i]);
  const changed = palette[i] !== f.hex ? " ← ajustée" : "  (originale conservée)";
  console.log(
    `  ${f.name.padEnd(11)} ${f.hex} → ${palette[i]}   L ${L.toFixed(3)}, C ${C.toFixed(3)}${changed}`,
  );
});

const { report, ok } = validate(palette, { mode: "light", surface: SURFACE, pairs: "all" });
console.log(`\nContrôle final (mode all-pairs, surface ${SURFACE}) :`);
for (const [name, state, detail] of report) {
  console.log(`  [${String(state).toUpperCase().padEnd(5)}] ${name.padEnd(22)} ${detail}`);
}
console.log(`\n  → ${ok ? "ALL CHECKS PASS" : "FAILED"}\n`);

console.log(`Série à reporter dans src/lib/chart-palette.ts :\n  "${palette.join(",")}"\n`);
process.exit(ok ? 0 : 1);
