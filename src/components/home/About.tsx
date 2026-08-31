import Image from "next/image";
import { getProfile } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { Parallax } from "@/components/ui/Parallax";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Annotation } from "@/components/ui/Annotation";
import { Stamp } from "@/components/ui/Stamp";
import { GitHubIcon, LinkedInIcon, MapPinIcon } from "@/components/ui/icons";

/** Teinte d'encre de chaque casquette. */
const ROLE_INKS = ["text-accent-deep", "text-cyan", "text-green"];
const ROLE_SQUARES = ["bg-accent", "bg-cyan", "bg-green"];

export async function About() {
  const profile = await getProfile();
  const roles = profile.title.split("·").map((r) => r.trim());

  return (
    <section id="apropos" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-site">
        <div className="grid items-start gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
          {/* Fiche d'archive (ou portrait, ajouté depuis l'admin) */}
          <Reveal className="relative mx-auto w-full max-w-sm lg:sticky lg:top-28">
            <Parallax amount={16}>
              <div className="relative overflow-visible border border-ink/25 bg-surface p-8 shadow-card">
                {/* filigrane monogramme — dérive plus lentement */}
                <Parallax amount={10}>
                  <span
                    className="watermark absolute -right-6 -top-12 select-none font-serif text-[13rem] italic leading-none"
                    aria-hidden
                  >
                    D.
                  </span>
                </Parallax>

                {profile.avatar_url ? (
                  /* Portrait chargé depuis l'admin */
                  <div className="relative overflow-hidden border border-ink/20">
                    <Image
                      src={profile.avatar_url}
                      alt={`Portrait de ${profile.name}`}
                      width={640}
                      height={800}
                      className="h-auto w-full object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg/80 to-transparent"
                      aria-hidden
                    />
                  </div>
                ) : (
                  /* Fiche typographique */
                  <div className="relative">
                    <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                      <span>Fiche d&rsquo;archive</span>
                      <span>N° 001</span>
                    </div>
                    <div className="rule-double mt-4" />

                    <p className="wonk mt-8 font-serif text-3xl leading-tight tracking-tight text-ink">
                      {profile.name}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {roles.map((role, i) => (
                        <li
                          key={role}
                          className="flex items-center gap-3 text-sm text-ink-dim"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rotate-45 ${ROLE_SQUARES[i % 3]}`}
                            aria-hidden
                          />
                          <span className={ROLE_INKS[i % 3]}>{role}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-8 flex items-center gap-2 border-t border-line-soft pt-6 text-sm text-ink-dim">
                      <MapPinIcon className="h-4 w-4 text-accent" />
                      {profile.location}
                    </p>
                  </div>
                )}

                {/* tampon circulaire — dérive plus vite que la fiche */}
                <Parallax amount={36}>
                  <Stamp
                    top="ARCHIVES"
                    center="2.0"
                    centerSub={profile.location.split(",")[0].toUpperCase()}
                    bottom="FICHE CONTRÔLÉE"
                    tone="accent"
                    size={104}
                    tilt={7}
                    delay={0.35}
                    className="absolute -right-5 -top-6"
                  />
                </Parallax>
              </div>
            </Parallax>
          </Reveal>

          {/* Texte */}
          <div>
            <Reveal>
              <SectionHeading
                cote="DCB·2026·02"
                tone="accent"
                title={
                  <>
                    L&rsquo;archiviste{" "}
                    <span className="relative inline-block">
                      qui code
                      <Annotation
                        type="underline"
                        delay={0.6}
                        className="absolute -bottom-1.5 left-0 h-3 w-full text-green"
                      />
                    </span>
                  </>
                }
                note="Je ne collectionne pas les métiers — je fais circuler l'information, du classement à l'outil."
                description={profile.bio}
              />
            </Reveal>

            {/* Chiffres du fonds */}
            <Reveal delay={0.08} className="mt-10">
              <div className="border border-ink/25 bg-surface px-6 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
                  Chiffres du fonds
                </p>
                <ul className="mt-3.5 space-y-2 text-sm">
                  {[
                    { label: "Missions d'archivage", value: "5" },
                    { label: "Organisations servies", value: "5" },
                    { label: "Postes en cours", value: "2" },
                    { label: "Plateforme GED construite", value: "DocuFlow" },
                  ].map((row) => (
                    <li key={row.label} className="flex items-baseline">
                      <span className="text-ink-dim">{row.label}</span>
                      <span className="leader" aria-hidden />
                      <span className="nums font-mono text-[13px] font-semibold text-ink">
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Aujourd'hui */}
            <Reveal delay={0.12} className="mt-6">
              <div className="border border-ink/25 bg-surface p-6 md:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
                  Aujourd&rsquo;hui
                </p>
                <p className="mt-3 font-serif text-xl leading-snug text-ink">
                  {profile.current_role}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line-soft pt-5 text-sm text-ink-dim">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rotate-45 bg-accent" aria-hidden />
                    Archives physiques &amp; électroniques
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rotate-45 bg-cyan" aria-hidden />
                    GED &amp; dématérialisation
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rotate-45 bg-green" aria-hidden />
                    Outils sur mesure
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16} className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-ink/40 px-5 py-2.5 text-sm text-ink transition-all duration-300 hover:border-accent hover:text-accent-deep"
              >
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-ink/40 px-5 py-2.5 text-sm text-ink transition-all duration-300 hover:border-accent hover:text-accent-deep"
              >
                <GitHubIcon className="h-4 w-4" />
                GitHub
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
