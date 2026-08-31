import {
  EXCLUDED_REPOS,
  FALLBACK_PROJECTS,
  FEATURED_ORDER,
  GITHUB_USERNAME,
  INCLUDE_NO_DESCRIPTION,
  REVALIDATE_SECONDS,
  REPO_OVERRIDES,
  type ChartSpec,
  type Hat,
} from "@/content/projects.config";

/**
 * Couche d'accès aux projets — dépôts publics GitHub.
 *
 * Les appels partent du serveur uniquement, mis en cache par le data
 * cache de Next (revalidation horaire) : aucune requête par visiteur,
 * donc pas de rate-limit GitHub en pratique. Un token optionnel
 * (GITHUB_TOKEN) augmente le plafond si le nombre de dépôts grimpe.
 *
 * Si l'API est injoignable au build, on retombe sur un instantané
 * statique (FALLBACK_PROJECTS) plutôt que sur une page vide.
 */

export type { Hat, ChartSpec } from "@/content/projects.config";

export type LanguageShare = {
  name: string;
  /** Octets de code — cf. l'API /languages. */
  bytes: number;
  /** Part du total, entre 0 et 1. */
  share: number;
};

export type GitHubProject = {
  slug: string;
  name: string;
  /** Cote d'archive du projet — ex. « PRJ·2026·01 ». */
  cote: string;
  description: string;
  repoUrl: string;
  liveUrl: string | null;
  homepage: string | null;
  stars: number;
  pushedAt: string;
  /** Langages triés par volume décroissant, queue repliée dans « Autre ». */
  languages: LanguageShare[];
  primaryLanguage: string | null;
  hats: Hat[];
  featured: boolean;
  highlights: string[];
  chart?: ChartSpec;
};

const API = "https://api.github.com";

type GitHubRepo = {
  name: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  updated_at: string;
  stargazers_count: number;
  language: string | null;
};

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Normalise une URL de démo (le champ homepage est souvent sans schéma). */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${API}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`,
    {
      headers: apiHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    },
  );
  if (!res.ok) throw new Error(`GitHub /repos : ${res.status}`);
  return res.json() as Promise<GitHubRepo[]>;
}

async function fetchLanguages(repo: string): Promise<Record<string, number>> {
  const res = await fetch(`${API}/repos/${GITHUB_USERNAME}/${repo}/languages`, {
    headers: apiHeaders(),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`GitHub /languages (${repo}) : ${res.status}`);
  return res.json() as Promise<Record<string, number>>;
}

/* ------------------------------------------------------------------ */
/* Curation & enrichissement                                          */
/* ------------------------------------------------------------------ */

/** Devine les casquettes d'un dépôt quand la config ne les fixe pas. */
function inferHats(repo: GitHubRepo): Hat[] {
  const haystack = `${repo.name} ${repo.description ?? ""} ${repo.language ?? ""}`.toLowerCase();
  const hats: Hat[] = [];
  if (/(ged|document|archiv|dossier|sae|record|numéris|numérisa|scan)/.test(haystack)) {
    hats.push("archives");
  }
  if (/(data|analy|power ?bi|visuali|statistiq|dashboard|report|graph)/.test(haystack)) {
    hats.push("data");
  }
  if (hats.length === 0 || /(react|node|express|django|python|javascript|typescript|web|app|site)/.test(haystack)) {
    hats.push("dev");
  }
  return hats;
}

/** Ventile les octets par langage — 4 premiers + « Autre ». */
function toLanguageShares(bytes: Record<string, number>): LanguageShare[] {
  const entries = Object.entries(bytes)
    .filter(([, b]) => b > 0)
    .sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return [];

  const total = entries.reduce((sum, [, b]) => sum + b, 0);
  const top = entries.slice(0, 4);
  const restBytes = entries.slice(4).reduce((sum, [, b]) => sum + b, 0);

  const shares = top.map(([name, b]) => ({ name, bytes: b, share: b / total }));
  if (restBytes > 0) shares.push({ name: "Autre", bytes: restBytes, share: restBytes / total });
  return shares;
}

function slugifyRepo(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Le registre complet, lu depuis GitHub — avec repli hors-ligne. */
export async function getProjects(): Promise<GitHubProject[]> {
  try {
    const repos = await fetchRepos();

    const kept = repos.filter((repo) => {
      if (repo.fork) return false;
      if (repo.archived) return false;
      if (EXCLUDED_REPOS.includes(repo.name)) return false;

      const override = REPO_OVERRIDES[repo.name];
      if (override?.hidden) return false;

      const hasDescription = Boolean(repo.description || override?.description);
      if (!hasDescription && !INCLUDE_NO_DESCRIPTION.includes(repo.name)) return false;

      return true;
    });

    const languagesByRepo = await Promise.all(
      kept.map(async (repo) => {
        try {
          return await fetchLanguages(repo.name);
        } catch {
          return {} as Record<string, number>;
        }
      }),
    );

    const projects: GitHubProject[] = kept.map((repo, i) => {
      const override = REPO_OVERRIDES[repo.name] ?? {};
      /* Le champ homepage du dépôt fait foi ; l'override complète sinon. */
      const liveUrl =
        normalizeUrl(repo.homepage) ?? normalizeUrl(override.liveUrl) ?? null;

      return {
        slug: slugifyRepo(repo.name),
        name: repo.name,
        cote: `PRJ·${repo.pushed_at.slice(0, 4)}·${String(i + 1).padStart(2, "0")}`,
        description: override.description ?? repo.description ?? "",
        repoUrl: repo.html_url,
        liveUrl,
        homepage: normalizeUrl(repo.homepage),
        stars: repo.stargazers_count,
        pushedAt: repo.pushed_at,
        languages: toLanguageShares(languagesByRepo[i] ?? {}),
        primaryLanguage: repo.language,
        hats: override.hats ?? inferHats(repo),
        featured: override.featured ?? FEATURED_ORDER.includes(repo.name),
        highlights: override.highlights ?? [],
        chart: override.chart,
      };
    });

    /* Tri : mis en avant d'abord (ordre de FEATURED_ORDER), puis activité. */
    projects.sort((a, b) => {
      const fa = FEATURED_ORDER.indexOf(a.name);
      const fb = FEATURED_ORDER.indexOf(b.name);
      if (fa !== -1 || fb !== -1) {
        if (fa === -1) return 1;
        if (fb === -1) return -1;
        return fa - fb;
      }
      return b.pushedAt.localeCompare(a.pushedAt);
    });

    /* Cotes réattribuées après tri, pour un ordre stable à l'écran. */
    const year = new Date().getFullYear();
    projects.forEach((p, i) => {
      p.cote = `PRJ·${year}·${String(i + 1).padStart(2, "0")}`;
    });

    return projects;
  } catch {
    return FALLBACK_PROJECTS.map((p, i) => ({
      ...p,
      cote: `PRJ·${new Date().getFullYear()}·${String(i + 1).padStart(2, "0")}`,
    }));
  }
}

/** Un projet par slug (page de détail). */
export async function getProjectBySlug(slug: string): Promise<GitHubProject | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}
