import type { Experience, Post, Profile, Skill } from "@/types/content";

/**
 * Contenu par défaut du site. Il sert de repli tant que le store Blob
 * n'a jamais été écrit (premier déploiement, store non configuré) — et
 * de point de départ materialisé au premier enregistrement depuis
 * l'admin. Le contenu réel vit dans Vercel Blob et se gère depuis
 * /admin.
 *
 * Les projets, eux, sont alimentés automatiquement par l'API GitHub —
 * voir src/lib/github.ts et src/content/projects.config.ts.
 */

export const DEFAULT_PROFILE: Profile = {
  name: "Daniel CHABI BOUKO",
  title: "Archiviste 2.0 · Data Analyst · Développeur web",
  tagline:
    "Je donne aux organisations une mémoire fiable — et je la rends vivante, cherchable et utile.",
  bio: "Archiviste et spécialiste en gestion documentaire, j'ai une expérience dans le traitement, l'organisation, la numérisation et la valorisation des archives physiques et électroniques (GED, dématérialisation, archivage numérique). Passionné par la transformation numérique, l'analyse de données et le développement web, je crée des outils qui optimisent la gestion de l'information au sein des organisations.",
  location: "Cotonou, Bénin",
  current_role:
    "Stagiaire archiviste — L'Africaine des Garanties et du Cautionnement (AFGC)",
  email: "",
  linkedin_url: "https://www.linkedin.com/in/danieljosephjr",
  github_url: "https://github.com/DanitechChabi",
  avatar_url: "",
};

export const DEFAULT_SKILLS: Skill[] = [
  // Pôle archivistique & GED — encre vermillon
  { id: 1, name: "GED — Gestion Électronique des Documents", category: "Archivistique & GED", level: 5, sort_order: 1 },
  { id: 2, name: "Traitement & classement d'archives", category: "Archivistique & GED", level: 5, sort_order: 2 },
  { id: 3, name: "Archivage numérique", category: "Archivistique & GED", level: 5, sort_order: 3 },
  { id: 4, name: "Numérisation, OCR & PDF/A", category: "Archivistique & GED", level: 4, sort_order: 4 },
  { id: 5, name: "Dématérialisation de fonds", category: "Archivistique & GED", level: 4, sort_order: 5 },
  { id: 6, name: "SAE — Système d'Archivage Électronique", category: "Archivistique & GED", level: 4, sort_order: 6 },
  { id: 7, name: "Conservation archivistique", category: "Archivistique & GED", level: 4, sort_order: 7 },

  // Pôle data & analyse — encre cyanotype
  { id: 12, name: "Analyse de données", category: "Data & analyse", level: 4, sort_order: 20 },
  { id: 13, name: "Microsoft Power BI", category: "Data & analyse", level: 4, sort_order: 21 },
  { id: 14, name: "Analyse de marché", category: "Data & analyse", level: 3, sort_order: 22 },
  { id: 15, name: "Data visualisation", category: "Data & analyse", level: 3, sort_order: 23 },
  { id: 16, name: "SQL", category: "Data & analyse", level: 3, sort_order: 24 },

  // Pôle développement — vert de repérage
  { id: 18, name: "React", category: "Développement web", level: 4, sort_order: 10 },
  { id: 19, name: "Node.js / Express", category: "Développement web", level: 4, sort_order: 11 },
  { id: 20, name: "Python", category: "Développement web", level: 4, sort_order: 12 },
  { id: 21, name: "JavaScript", category: "Développement web", level: 4, sort_order: 13 },
  { id: 22, name: "Tailwind CSS", category: "Développement web", level: 4, sort_order: 14 },
  { id: 23, name: "Django", category: "Développement web", level: 3, sort_order: 15 },
  { id: 24, name: "PostgreSQL", category: "Développement web", level: 3, sort_order: 16 },
];

/** Expériences par défaut — le « registre des services » d'origine. */
export const DEFAULT_EXPERIENCES: Experience[] = [
  {
    id: 1,
    cote: "EXP·2026·05",
    role: "Stagiaire archiviste",
    org: "L'Africaine des Garanties et du Cautionnement (AFGC)",
    type: "Temps plein",
    period: "mai 2026 — aujourd'hui",
    start: "2026-05",
    current: true,
    location: "Cotonou, Bénin",
    summary:
      "Archivage numérique et traitement archivistique d'un fonds d'entreprise — et le constat de terrain qui a donné naissance à DocuFlow.",
    highlights: [
      "Traitement et valorisation des archives physiques et électroniques",
      "Constat : des dossiers bien classés, mais des temps d'accès trop longs — d'où DocuFlow",
    ],
    hats: ["archives", "dev"],
  },
  {
    id: 2,
    cote: "EXP·2025·04",
    role: "Technicien archiviste",
    org: "Clinique John Holt",
    type: "Temps partiel",
    period: "nov. 2025 — aujourd'hui",
    start: "2025-11",
    current: true,
    location: "Cotonou, Bénin",
    summary:
      "Gestion, organisation et sécurisation des documents administratifs et médicaux : structurer les flux, garantir la traçabilité, respecter confidentialité et conformité.",
    highlights: [
      "Chaîne complète de numérisation : préparation, métadonnées, numérisation PDF/A, contrôle qualité, OCR, indexation",
      "Intégration dans une GED : arborescences structurées, workflows, gestion des accès et du cycle de vie",
      "Optimisation des circuits de validation et accompagnement des équipes",
    ],
    hats: ["archives"],
  },
  {
    id: 3,
    cote: "EXP·2025·03",
    role: "Technicien archiviste",
    org: "RMBI",
    type: "Temps plein",
    period: "déc. 2025 — juin 2026",
    start: "2025-12",
    location: "Cotonou, Bénin",
    summary:
      "Participation à l'installation et à la mise en production d'un Système d'Archivage Électronique (SAE) et d'une solution GED.",
    highlights: [
      "Installation et configuration d'un SAE, contribution au déploiement d'une GED",
      "Organisation, classement et indexation des documents numériques",
      "Tests fonctionnels, vérification qualité, appui à la mise en production",
    ],
    hats: ["archives", "dev"],
  },
  {
    id: 4,
    cote: "EXP·2025·02",
    role: "Stagiaire archiviste",
    org: "Cabinet GAEI",
    type: "Stage",
    period: "mai 2025 — août 2025",
    start: "2025-05",
    location: "Cotonou, Bénin",
    summary:
      "Trait intégral d'un fonds documentaire : du dépouillement au rangement, en passant par la numérisation.",
    highlights: [
      "Dépouillement, tri, traitement et saisie",
      "Numérisation et rangement du fonds",
    ],
    hats: ["archives"],
  },
  {
    id: 5,
    cote: "EXP·2024·01",
    role: "Archiviste de projet",
    org: "Cabinet Bersi",
    type: "Stage",
    period: "oct. 2024 — déc. 2024",
    start: "2024-10",
    location: "Cotonou, Bénin",
    summary:
      "Première mission d'archivage de projet — le point de départ du métier, sur le terrain.",
    hats: ["archives"],
  },
];

export const DEFAULT_POSTS: Post[] = [
  {
    id: 1,
    title: "L'archiviste 2.0 ne remplace pas le document : il lui donne une seconde vie",
    slug: "archiviste-2-0-seconde-vie-du-document",
    excerpt:
      "De la salle d'archives au code : comment la maîtrise du document m'a mené à construire moi-même les outils qui le font vivre.",
    content: `On me le dit souvent, ce slogan : _« L'IA ne remplacera pas l'archiviste, mais l'archiviste qui utilise l'IA remplacera celui qui ne l'utilise pas. »_ Je le trouve juste, à une nuance près : avant de parler d'IA, il faut parler d'accès.

## Le meilleur classement du monde ne suffit pas

En stage chez AFGC, j'ai retrouvé des dossiers classés avec un soin irréprochable. L'arborescence était claire, la cotation cohérente, les inventaires tenus. Et pourtant : chaque demande de dossier devenait une expédition. Non pas parce que l'information était mal rangée, mais parce qu'elle était *physiquement* hors d'atteinte du temps réel de l'organisation.

C'est là que j'ai compris que mon métier ne s'arrêtait pas au classement. Un document qu'on ne retrouve pas en quelques secondes n'existe pas pour celui qui en a besoin à l'instant même.

## De l'archive à l'outil

Plutôt que de subir cette friction, j'ai choisi de la supprimer : j'ai appris à développer. D'abord pour automatiser de petites tâches, puis pour construire DocuFlow — une plateforme de gestion électronique des documents pensée depuis la salle d'archives, pas depuis un cahier des charges théorique.

L'archiviste qui code n'est pas un archiviste qui a changé de métier. C'est un archiviste qui a étendu son périmètre d'action : là où je classais l'information, je conçois maintenant les systèmes qui la font circuler.

## Ce que je retiens

- **La valeur d'une archive se mesure au temps d'accès**, pas à la beauté du plan de classement.
- **La GED n'est pas un projet informatique** : c'est un projet de mémoire organisationnelle.
- **L'IA est un auxiliaire, pas une doctrine** — elle classe, suggère, détecte ; l'archiviste décide, contextualise, garantit.

Le document n'a pas disparu. Il a simplement changé de corps — et quelqu'un doit continuer à en garantir l'intégrité. C'est toujours mon métier.`,
    cover_image_url: "",
    published: true,
    published_at: "2026-08-20T09:00:00.000Z",
    created_at: "2026-08-20T09:00:00.000Z",
  },
];
