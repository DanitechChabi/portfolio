import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjects } from "@/lib/github";
import { LivePreview } from "@/components/projects/LivePreview";
import { ProjectChart } from "@/components/projects/ProjectChart";
import { LanguageBar } from "@/components/projects/LanguageBar";
import { HatBadges } from "@/components/projects/HatBadges";
import { Cote } from "@/components/ui/Cote";
import { Reveal } from "@/components/ui/Reveal";
import { formatDate } from "@/lib/format";
import { formatBytes, formatShare } from "@/lib/chart-palette";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GitHubIcon,
} from "@/components/ui/icons";

/* ISR : les fiches suivent le rythme du registre GitHub (1 h). */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Projet introuvable" };

  return {
    title: project.name,
    description: project.description,
    alternates: { canonical: `/projets/${project.slug}` },
    openGraph: {
      title: project.name,
      description: project.description,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="container-site">
        {/* Retour au registre */}
        <Reveal>
          <Link
            href="/#projets"
            className="inline-flex items-center gap-2 text-sm text-ink-dim transition-colors hover:text-accent-soft"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Registre des projets
          </Link>
        </Reveal>

        {/* En-tête de fiche */}
        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-8 border-b-2 border-ink pb-10">
            <div className="max-w-2xl">
              <Cote code={project.cote} label="Cote" tone="accent" />
              <h1 className="wonk mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
                {project.name}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-ink-dim md:text-lg">
                {project.description}
              </p>
              <div className="mt-6">
                <HatBadges hats={project.hats} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-ink px-5 py-2.5 text-sm text-ink transition-all duration-300 hover:border-accent/60 hover:text-accent-soft"
              >
                <GitHubIcon className="h-4 w-4" />
                Code source
              </a>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-deep hover:text-surface"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Démo live
                </a>
              )}
            </div>
          </div>
        </Reveal>

        {/* Aperçu live */}
        {project.liveUrl && (
          <Reveal delay={0.1} className="mt-12">
            <LivePreview url={project.liveUrl} title={project.name} />
          </Reveal>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-[7fr_4fr] lg:gap-16">
          <div>
            {/* Lecture des données */}
            {project.chart && (
              <Reveal>
                <section aria-labelledby="lecture-donnees">
                  <h2
                    id="lecture-donnees"
                    className="font-serif text-2xl text-ink"
                  >
                    Lecture des données
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-dim">
                    Ce que voit l&apos;archiviste quand il ouvre le tableau de bord
                    du projet — la donnée, faite pour parler.
                  </p>
                  <div className="mt-8">
                    <ProjectChart spec={project.chart} />
                  </div>
                </section>
              </Reveal>
            )}

            {/* Points de repérage */}
            {project.highlights.length > 0 && (
              <Reveal className={project.chart ? "mt-16" : undefined}>
                <section aria-labelledby="points-reperage">
                  <h2
                    id="points-reperage"
                    className="font-serif text-2xl text-ink"
                  >
                    Points de repérage
                  </h2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {project.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-3 border border-ink/20 bg-surface px-4 py-3.5 text-sm text-ink"
                      >
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rotate-45 bg-green"
                          aria-hidden
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            )}

            {/* Sources — quand ni démo ni graphe ne racontent tout */}
            {!project.liveUrl && project.highlights.length === 0 && (
              <Reveal>
                <section>
                  <h2 className="font-serif text-2xl text-ink">Le projet</h2>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-dim">
                    {project.description} La fiche technique et le code source
                    en disent plus — tout est public.
                  </p>
                </section>
              </Reveal>
            )}
          </div>

          {/* Colonne latérale — la fiche technique */}
          <Reveal delay={0.1}>
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="border border-ink/25 bg-surface p-6">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                  Fiche technique
                </h2>
                <dl className="mt-4 divide-y divide-line-soft">
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-sm text-ink-dim">Cote</dt>
                    <dd className="font-mono text-sm text-ink">{project.cote}</dd>
                  </div>
                  {project.primaryLanguage && (
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-sm text-ink-dim">Langage principal</dt>
                      <dd className="font-mono text-sm text-ink">
                        {project.primaryLanguage}
                      </dd>
                    </div>
                  )}
                  {project.stars > 0 && (
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-sm text-ink-dim">Étoiles GitHub</dt>
                      <dd className="font-mono text-sm text-ink">
                        <span className="mr-1 text-accent" aria-hidden>
                          ★
                        </span>
                        {project.stars}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-sm text-ink-dim">Dernière mise à jour</dt>
                    <dd className="font-mono text-sm text-ink">
                      {formatDate(project.pushedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              {project.languages.length > 0 && (
                <div className="border border-ink/25 bg-surface p-6">
                  <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                    Composition du code
                  </h2>
                  <div className="mt-5">
                    <LanguageBar languages={project.languages} />
                  </div>
                  <table className="mt-5 w-full border-collapse text-sm">
                    <caption className="sr-only">
                      Volume de code par langage
                    </caption>
                    <thead>
                      <tr className="border-b border-ink/40">
                        <th scope="col" className="py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                          Langage
                        </th>
                        <th scope="col" className="py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                          Part
                        </th>
                        <th scope="col" className="py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.languages.map((language) => (
                        <tr key={language.name} className="border-b border-line-soft">
                          <th scope="row" className="py-2 text-left font-normal text-ink">
                            {language.name}
                          </th>
                          <td className="py-2 text-right tabular-nums text-ink">
                            {formatShare(language.share)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-ink-faint">
                            {formatBytes(language.bytes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border border-ink/25 bg-surface p-6">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                  Communication
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between border border-line-soft bg-bg/60 px-4 py-3 text-sm text-ink transition-colors hover:border-accent/50"
                    >
                      <span className="flex items-center gap-3">
                        <ExternalLinkIcon className="h-4 w-4 text-accent" />
                        Site en production
                      </span>
                      <span
                        className="text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                        aria-hidden
                      >
                        →
                      </span>
                    </a>
                  )}
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border border-line-soft bg-bg/60 px-4 py-3 text-sm text-ink transition-colors hover:border-accent/50"
                  >
                    <span className="flex items-center gap-3">
                      <GitHubIcon className="h-4 w-4 text-accent" />
                      Dépôt GitHub
                    </span>
                    <span
                      className="text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                      aria-hidden
                    >
                      →
                    </span>
                  </a>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </article>
  );
}
