"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { GitHubProject, Hat } from "@/lib/github";
import { EASE } from "@/lib/motion";
import { Cote } from "@/components/ui/Cote";
import { formatDate } from "@/lib/format";
import { LanguageBar } from "./LanguageBar";
import { HatBadges } from "./HatBadges";

type Filter = "all" | Hat;
type View = "registre" | "vitrine";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tout le fonds" },
  { key: "archives", label: "Archivage" },
  { key: "data", label: "Data" },
  { key: "dev", label: "Développement" },
];

/**
 * Explorateur du fonds de projets : filtres par casquette en onglets
 * de chemise, deux lectures (registre tabulaire / vitrine de cartes),
 * transitions fluides (FLIP) d'une vue et d'un filtre à l'autre.
 */
export function ProjectsExplorer({ projects }: { projects: GitHubProject[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("registre");
  const reduce = useReducedMotion();

  const counts = useMemo(() => {
    const byHat: Record<Filter, number> = {
      all: projects.length,
      archives: projects.filter((p) => p.hats.includes("archives")).length,
      data: projects.filter((p) => p.hats.includes("data")).length,
      dev: projects.filter((p) => p.hats.includes("dev")).length,
    };
    return byHat;
  }, [projects]);

  const visible = useMemo(
    () =>
      filter === "all" ? projects : projects.filter((p) => p.hats.includes(filter)),
    [projects, filter],
  );

  const itemMotion = {
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? undefined : { opacity: 0, y: -8 },
    transition: reduce ? { duration: 0 } : { duration: 0.3, ease: EASE },
  };

  return (
    <div>
      {/* Barre de filtres — onglets de chemise + bascule de lecture */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrer les projets par casquette"
        >
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={`tab-folder px-4 pb-2.5 pt-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                  isActive
                    ? "bg-ink text-onink"
                    : "bg-surface-2 text-ink-dim hover:bg-line/70 hover:text-ink"
                }`}
              >
                {label}
                <span className={`ml-2 ${isActive ? "text-onink-faint" : "text-ink-faint"}`}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex border border-ink"
          role="group"
          aria-label="Mode d'affichage des projets"
        >
          {(["registre", "vitrine"] as View[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                view === mode ? "bg-ink text-onink" : "bg-surface text-ink-dim hover:text-ink"
              }`}
            >
              {mode === "registre" ? "Registre" : "Vitrine"}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu du classeur */}
      <div className="border-2 border-ink bg-bg">
        <p className="sr-only" aria-live="polite">
          {visible.length} projet{visible.length > 1 ? "s" : ""} affiché
          {visible.length > 1 ? "s" : ""}.
        </p>

        {visible.length === 0 ? (
          <p className="border-b border-dashed border-line px-6 py-14 text-center font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
            Aucun projet sous cette cote — le fonds s&apos;étoffe au fil des dépôts.
          </p>
        ) : view === "registre" ? (
          <ul>
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((project) => (
                <motion.li
                  key={project.slug}
                  layout
                  {...itemMotion}
                  className="border-b border-line-soft last:border-b-0"
                >
                  <Link
                    href={`/projets/${project.slug}`}
                    className="group grid gap-x-6 gap-y-3 px-4 py-5 transition-colors duration-200 hover:bg-ink/[0.025] md:grid-cols-[7.5rem_1fr_auto] md:px-6"
                  >
                    <div className="md:pt-1">
                      <Cote code={project.cote} tone="accent" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="flex flex-wrap items-center gap-2.5">
                        <span className="font-serif text-lg leading-snug text-ink transition-colors duration-200 group-hover:text-accent-deep">
                          {project.name}
                        </span>
                        {project.featured && (
                          <span
                            className="-rotate-2 border border-accent/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-accent"
                            aria-label="Projet phare"
                          >
                            Phare
                          </span>
                        )}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-dim">
                        {project.description}
                      </p>
                      {project.languages.length > 0 && (
                        <div className="mt-3 max-w-md">
                          <LanguageBar languages={project.languages} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end md:text-right">
                      <HatBadges hats={project.hats} />
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        maj {formatDate(project.pushedAt)}
                      </p>
                      <span
                        className="text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                        aria-hidden
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <ul className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((project) => (
                <motion.li key={project.slug} layout {...itemMotion} className="h-full">
                  <Link
                    href={`/projets/${project.slug}`}
                    className={`group flex h-full flex-col p-6 transition-colors duration-300 ${
                      project.featured
                        ? "border-2 border-t-2 border-ink border-t-accent bg-surface hover:border-accent/60"
                        : "border border-ink/25 bg-surface hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Cote code={project.cote} tone="accent" />
                      {project.featured && (
                        <span
                          className="-mt-1 -rotate-3 border-2 border-accent px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-accent"
                          aria-label="Projet phare"
                        >
                          Phare
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-serif text-xl leading-snug text-ink transition-colors duration-200 group-hover:text-accent-deep">
                      {project.name}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-dim">
                      {project.description}
                    </p>

                    {project.languages.length > 0 && (
                      <div className="mt-4">
                        <LanguageBar languages={project.languages} />
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                      <HatBadges hats={project.hats} />
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        maj {formatDate(project.pushedAt)}
                      </p>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Registre synchronisé sur github.com/
        <a
          href="https://github.com/DanitechChabi?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent/80 underline-offset-2 hover:underline"
        >
          DanitechChabi
        </a>{" "}
        — cotation PRJ, mise à jour horaire.
      </p>
    </div>
  );
}
