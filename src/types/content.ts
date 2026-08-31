/**
 * Types du contenu du site.
 *
 * Le contenu administrable (profil, articles, compétences, expériences,
 * messages) vit dans Vercel Blob — des fichiers JSON lus et écrits par
 * src/lib/store.ts. Ce module décrit la forme des données, partagée par
 * le site public, l'interface /admin et le contenu par défaut
 * (src/lib/default-content.ts) qui sert de repli tant que le store
 * n'a jamais été écrit.
 *
 * Les projets suivent leur propre chemin : API GitHub
 * (src/lib/github.ts) + curation dans src/content/projects.config.ts.
 */

export type Profile = {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  current_role: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  avatar_url: string;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type Skill = {
  id: number;
  name: string;
  /** Pôle : « Archivistique & GED », « Data & analyse », « Développement web »… */
  category: string;
  /** Niveau maîtrise, de 1 (notions) à 5 (expert). */
  level: number;
  sort_order: number;
};

export type Message = {
  /** UUID — sert de nom de fichier dans le store : introuvable sans token. */
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
};

/** Casquettes métier — une encre chacune sur le site public. */
export type Hat = "archives" | "data" | "dev";

/** Une entrée du « registre des services » (section Expériences). */
export type Experience = {
  id: number;
  /** Cote d'archive — ex. « EXP·2026·05 ». */
  cote: string;
  role: string;
  org: string;
  type: "Temps plein" | "Temps partiel" | "Stage" | "Formation";
  /** Période affichée — ex. « mai 2026 — aujourd'hui ». */
  period: string;
  /** Début (clé de tri), format YYYY-MM. */
  start: string;
  current?: boolean;
  location: string;
  summary?: string;
  highlights?: string[];
  /** Casquettes mobilisées par cette expérience. */
  hats: Hat[];
};
