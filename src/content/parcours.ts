/**
 * Formations & certifications — contenu éditorial stable.
 *
 * Ces entrées changent rarement (un diplôme, une certification) : elles
 * restent donc dans le code, versionnées avec le site. Les expériences
 * professionnelles, elles, sont administrables depuis /admin (store
 * Vercel Blob) avec repli sur src/lib/default-content.ts.
 */

import type { Hat } from "@/types/content";

export type { Hat };

export type Formation = {
  cote: string;
  title: string;
  org: string;
  period: string;
  detail?: string;
  tone: "accent" | "cyan" | "green";
  stamp: { top: string; center: string; bottom: string };
};

export const FORMATIONS: Formation[] = [
  {
    cote: "FOR·2021·01",
    title: "Licence en Archivistique",
    org: "École Nationale d'Administration — Université d'Abomey-Calavi (ENA UAC)",
    period: "2021 — 2025",
    detail:
      "La formation fondatrice : sciences de l'information, traitement des archives, records management.",
    tone: "accent",
    stamp: { top: "ÉCOLE NATIONALE D'ADMINISTRATION", center: "Licence", bottom: "ARCHIVISTIQUE — UAC" },
  },
  {
    cote: "FOR·2025·02",
    title: "Data Analyst — Data / IA",
    org: "Africa TechUp Tour × Isheero (Initiative Béninoise sur l'IA)",
    period: "mai 2025 — aujourd'hui",
    detail:
      "Microsoft Power BI, analyse de marché, analyse de données et intelligence artificielle appliquée.",
    tone: "cyan",
    stamp: { top: "AFRICA TECHUP TOUR × ISHEERO", center: "Data", bottom: "ANALYSE & IA — 2025" },
  },
];
