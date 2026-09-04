/**
 * Configuration des projets — la curation du fonds.
 *
 * La page Projets est alimentée automatiquement par l'API GitHub
 * (dépôts publics de GITHUB_USERNAME). Ce fichier contrôle ce qui
 * s'affiche et enrichit ce que l'API ne dit pas :
 *
 * - EXCLUDED_REPOS        : dépôts à masquer (tests, brouillons…) ;
 * - INCLUDE_NO_DESCRIPTION: dépôts sans description à afficher quand même ;
 * - REPO_OVERRIDES        : par nom de dépôt — description enrichie, URL de
 *   démo, casquettes (archiviste / data / dev), points forts, mini-graphe ;
 * - FEATURED_ORDER        : dépôts mis en avant, dans l'ordre.
 *
 * Ajouter un projet = pousser un repo GitHub avec une description,
 * puis au besoin 3 lignes dans REPO_OVERRIDES.
 */

export type Hat = "archives" | "data" | "dev";

export type ChartKind = "columns" | "line";

/** Mini-graphique représentatif d'un projet (page détail). */
export type ChartSpec = {
  title: string;
  /** Ce que mesure l'axe des valeurs — ex. « documents traités ». */
  unit: string;
  kind: ChartKind;
  points: { label: string; value: number }[];
};

export type ProjectOverride = {
  /** Remplace la description GitHub si fournie. */
  description?: string;
  /** URL de démo si le champ homepage du dépôt est vide. */
  liveUrl?: string;
  /** Casquettes mobilisées par le projet. */
  hats?: Hat[];
  /** Mettre en avant (false pour retirer d'existant). */
  featured?: boolean;
  /** Masquer complètement ce dépôt. */
  hidden?: boolean;
  /** Points forts — page de détail. */
  highlights?: string[];
  /** Mini-graphe (page de détail). */
  chart?: ChartSpec;
};

export const GITHUB_USERNAME = "DanitechChabi";

/** Revalidation ISR des données GitHub (1 heure). */
export const REVALIDATE_SECONDS = 3600;

/** Dépôts à ne jamais afficher. */
export const EXCLUDED_REPOS: string[] = [];

/** Dépôts sans description à afficher malgré tout. */
export const INCLUDE_NO_DESCRIPTION: string[] = [];

/** Dépôts mis en avant, dans l'ordre d'affichage. */
export const FEATURED_ORDER: string[] = [
  "DocuFlow-Landing",
  "DocuFlow",
  "kale",
  "monreseau",
];

export const REPO_OVERRIDES: Record<string, ProjectOverride> = {
  "DocuFlow-Landing": {
    description:
      "Plateforme GED couplée à un système de gestion électronique des demandes — née d'un constat simple en stage : trop de temps perdu à retrouver des dossiers pourtant bien archivés.",
    liveUrl: "https://docuflow-afgc.vercel.app",
    hats: ["archives", "dev", "data"],
    featured: true,
    highlights: [
      "~50 paramètres de configuration",
      "Arborescence de classement personnalisable",
      "IA intégrée pour la gestion intelligente des données",
      "Tableau de bord d'analyse (documents & demandes)",
      "Messagerie interne avec transmission de fichiers",
      "Version desktop disponible",
    ],
    chart: {
      title: "Flux documentaire mensuel — vision du tableau de bord",
      unit: "documents traités",
      kind: "columns",
      points: [
        { label: "Jan", value: 1240 },
        { label: "Fév", value: 1580 },
        { label: "Mar", value: 2110 },
        { label: "Avr", value: 1890 },
        { label: "Mai", value: 2640 },
        { label: "Juin", value: 3120 },
        { label: "Juil", value: 2890 },
        { label: "Août", value: 3480 },
      ],
    },
  },
  DocuFlow: {
    description:
      "Le cœur applicatif de la plateforme DocuFlow : gestion électronique des documents et des demandes, pensée depuis la salle d'archives.",
    liveUrl: "https://getdocuflow.vercel.app",
    hats: ["archives", "dev"],
    featured: true,
    highlights: [
      "Backend Node.js / Express sur PostgreSQL",
      "Front React + Vite, tableau de bord d'analyse",
      "Arborescences de classement paramétrables",
    ],
  },
  dino3D: {
    description: "Jeu 3D dans le navigateur — démo en ligne.",
  },
  kale: {
    description:
      "Kalé — la voix de ta communauté : plateforme communautaire en TypeScript.",
    liveUrl: "https://danitechchabi.github.io/kale/",
    featured: true,
  },
  monreseau: {
    description:
      "Projet académique Django — réseau social : comptes, amis, groupes, publications, messagerie (déployé sur Render).",
    liveUrl: "https://monreseau-prdc.onrender.com",
    hats: ["dev"],
    featured: true,
  },
  portfolio: {
    description:
      "Portfolio « Le Registre » — la carrière d'un archiviste 2.0 mise en page comme un fonds d'archives (Next.js, TypeScript, Vercel).",
    liveUrl: "https://danielchabi.vercel.app",
    hats: ["dev"],
  },
};

/* ------------------------------------------------------------------ */
/* Repli hors-ligne — utilisé si l'API GitHub est injoignable au build */
/* ------------------------------------------------------------------ */

export type FallbackProject = {
  slug: string;
  name: string;
  description: string;
  repoUrl: string;
  liveUrl: string | null;
  homepage: string | null;
  pushedAt: string;
  stars: number;
  primaryLanguage: string | null;
  /** Langages vides : la barre se met en repli « non ventilé ». */
  languages: { name: string; bytes: number; share: number }[];
  hats: Hat[];
  featured: boolean;
  highlights: string[];
  chart?: ChartSpec;
};

export const FALLBACK_PROJECTS: FallbackProject[] = [
  {
    slug: "docuflow-landing",
    name: "DocuFlow-Landing",
    description:
      "Application de gestion électronique des documents / demandes — plateforme GED née d'un constat de terrain en stage archiviste.",
    repoUrl: "https://github.com/DanitechChabi/DocuFlow-Landing",
    liveUrl: "https://docuflow-afgc.vercel.app",
    homepage: "https://docuflow-afgc.vercel.app",
    pushedAt: "2026-08-31T12:49:34Z",
    stars: 0,
    primaryLanguage: "JavaScript",
    languages: [{ name: "JavaScript", bytes: 1, share: 1 }],
    hats: ["archives", "dev", "data"],
    featured: true,
    highlights: [
      "~50 paramètres de configuration",
      "Arborescence de classement personnalisable",
      "Tableau de bord d'analyse (documents & demandes)",
    ],
  },
];
