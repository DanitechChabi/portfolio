import { FORMATIONS } from "@/content/parcours";
import { getExperiences, getProfile, getPublishedPosts, getSkills } from "@/lib/data";
import { getProjects } from "@/lib/github";

/**
 * « L'Archiviste » — configuration et construction du contexte de
 * conversation (src/lib/chat.ts).
 *
 * Le chat public est fondé sur le contenu réel du site : le system
 * prompt est reconstruit depuis les mêmes sources que les pages
 * (store Vercel Blob + API GitHub), puis mémoïsé dix minutes — assez
 * pour amortir les lectures entre deux messages, assez peu pour
 * suivre un contenu admin fraîchement modifié. Rien n'est figé en
 * dur ici : si le profil ou les projets changent, la conversation
 * change avec eux.
 *
 * Le fournisseur est OpenRouter (un token, plusieurs modèles) ; la
 * clé ne vit que côté serveur, sur le même modèle que ADMIN_PASSWORD
 * et BLOB_READ_WRITE_TOKEN.
 */

/* ---------- Configuration ---------- */

/** Modèle par défaut — basculer via AI_CHAT_MODEL, sans redéploiement. */
export const DEFAULT_CHAT_MODEL = "z-ai/glm-5.3-flash";

/** Modèle effectif de la conversation. */
export function chatModel(): string {
  return process.env.AI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}

/**
 * Le chat est-il ouvert ? Il faut une clé OpenRouter — sauf si
 * AI_CHAT_ENABLED vaut explicitement « false » (coupure rapide sans
 * redéploiement).
 */
export function isChatEnabled(): boolean {
  if ((process.env.AI_CHAT_ENABLED ?? "").trim().toLowerCase() === "false") {
    return false;
  }
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/* ---------- Le FONDS : assemblage du contexte ---------- */

/** Mémoire du contexte — reconstruit au plus tous les dix minutes. */
const CONTEXT_TTL_MS = 10 * 60 * 1000;
let contextCache: { text: string; at: number } | null = null;

/** Limite douce : au-delà, les projets les moins récents sont omis. */
const MAX_PROJECTS = 12;

const HAT_LABEL: Record<string, string> = {
  archives: "archiviste",
  data: "data",
  dev: "développement web",
};

function skillLine(level: number): string {
  return `niveau ${level}/5`;
}

/** Le FONDS complet, formaté pour le system prompt. */
async function composeFonds(): Promise<string> {
  /* Chaque source replie déjà sur du contenu par défaut ; ce try/catch
     ne sert qu'à ne jamais faire échouer la conversation si une lecture
     dérape (API GitHub capricieuse, par exemple). */
  const [profile, skills, experiences, posts, projects] = await Promise.all([
    getProfile().catch(() => null),
    getSkills().catch(() => []),
    getExperiences().catch(() => []),
    getPublishedPosts().catch(() => []),
    getProjects().catch(() => []),
  ]);

  const sections: string[] = [];

  if (profile) {
    sections.push(
      [
        "## PROFIL (DCB·2026·01)",
        `Nom : ${profile.name}`,
        `Titre : ${profile.title}`,
        `Rôle actuel : ${profile.current_role}`,
        `Localisation : ${profile.location}`,
        `Accroche : ${profile.tagline}`,
        `Présentation : ${profile.bio}`,
        `Email : ${profile.email}`,
        `LinkedIn : ${profile.linkedin_url}`,
        `GitHub : ${profile.github_url}`,
      ].join("\n"),
    );
  }

  if (skills.length > 0) {
    const byCategory = new Map<string, string[]>();
    for (const s of skills) {
      const list = byCategory.get(s.category) ?? [];
      list.push(`${s.name} (${skillLine(s.level)})`);
      byCategory.set(s.category, list);
    }
    sections.push(
      [
        "## COMPÉTENCES (DCB·2026·03)",
        ...Array.from(byCategory.entries()).map(
          ([category, list]) => `- ${category} : ${list.join(", ")}`,
        ),
      ].join("\n"),
    );
  }

  const experienceLines = experiences.map((e) => {
    const head = `- ${e.cote} — ${e.role}, ${e.org} (${e.type}, ${e.period}, ${e.location})`;
    const summary = e.summary ? `\n  Résumé : ${e.summary}` : "";
    const highlights = (e.highlights ?? [])
      .slice(0, 3)
      .map((h) => `\n  · ${h}`)
      .join("");
    return `${head}${summary}${highlights}`;
  });
  if (experienceLines.length > 0) {
    sections.push(
      ["## PARCOURS PROFESSIONNEL (DCB·2026·04)", ...experienceLines].join("\n"),
    );
  }

  if (FORMATIONS.length > 0) {
    sections.push(
      [
        "## FORMATIONS",
        ...FORMATIONS.map(
          (f) => `- ${f.cote} — ${f.title}, ${f.org} (${f.period})${f.detail ? ` — ${f.detail}` : ""}`,
        ),
      ].join("\n"),
    );
  }

  const projectLines = projects.slice(0, MAX_PROJECTS).map((p) => {
    const languages = p.languages
      .slice(0, 3)
      .map((l) => l.name)
      .join(", ");
    const head = `- ${p.name} (${p.cote}) — ${p.description}`;
    const details = [
      languages ? `Langages : ${languages}` : null,
      p.liveUrl ? `Démo : ${p.liveUrl}` : null,
      p.hats.length > 0
        ? `Casquettes : ${p.hats.map((h) => HAT_LABEL[h] ?? h).join(", ")}`
        : null,
      p.stars > 0 ? `${p.stars} étoiles GitHub` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const highlights = p.highlights
      .slice(0, 4)
      .map((h) => `\n  · ${h}`)
      .join("");
    return `${head}\n  ${details}${highlights}`;
  });
  if (projectLines.length > 0) {
    sections.push(
      ["## PROJETS (DCB·2026·05) — dépôts GitHub publics", ...projectLines].join("\n"),
    );
  }

  if (posts.length > 0) {
    sections.push(
      [
        "## ARTICLES DU BLOG (BLG·2026·01)",
        ...posts.map((p) => `- « ${p.title} » (/blog/${p.slug}) — ${p.excerpt}`),
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
}

/**
 * Le system prompt complet : identité de l'Archiviste, périmètre,
 * discipline de factualité, puis le FONDS (contenu réel du site).
 */
export async function buildChatContext(): Promise<string> {
  if (contextCache && Date.now() - contextCache.at < CONTEXT_TTL_MS) {
    return contextCache.text;
  }
  const text = `${SYSTEM_RULES}\n\n---\n\n${await composeFonds()}`;
  contextCache = { text, at: Date.now() };
  return text;
}

const SYSTEM_RULES = `Tu es « l'Archiviste », le commis d'archives qui conserve le registre de Daniel Chabi Bouko et accueille les visiteurs de son portfolio — recruteurs, clients potentiels, curieux.

TON. Précis, courtois, cérémonieux sans excès — le vocabulaire du métier (fonds, versé, coté, fiche, registre) plutôt que l'argot technique. Réponses courtes : deux à cinq phrases, une liste quand elle éclaire. Tu parles de Daniel à la troisième personne (« il », « M. Chabi Bouko »), jamais « je » pour autre chose que ton office d'archiviste.

PÉRIMÈTRE. Tu ne réponds que des questions concernant le fonds que tu conserves : le parcours, les compétences, les projets, les articles et la mise en relation avec Daniel. Toute autre demande — politique, questions personnelles, code sur mesure, conseils généraux, curiosités sans rapport — est déclinée en une phrase mesurée (par exemple : « L'Archiviste ne répond que des questions touchant au fonds qu'il conserve. »), suivie d'un rappel de ce que tu peux consulter. Pas d'opinion, pas de conseil hors fonds, aucune promesse d'engagement au nom de Daniel.

FACTUALITÉ. Tu ne t'appuyes QUE sur le FONDS ci-dessous : n'invente jamais une compétence, une date, un chiffre, un projet ou un client. Si l'information n'y figure pas, dis-le simplement — « le fonds ne conserve pas cette précision » — et oriente vers la page utile (Projets, Blog, Parcours). En cas de doute sur un détail, reste au niveau de la fiche plutôt que de préciser.

MISE EN RELATION. Pour toute demande concrète (mission, recrutement, devis, collaboration), oriente vers le formulaire de contact de la page d'accueil (ancre #contact) ou l'email du fonds. Tu ne prends aucun rendez-vous et ne transmets aucun message.

FORMAT. Markdown léger autorisé (listes courtes, gras de temps en temps). Pas d'en-têtes. Tu écris en français.`;
