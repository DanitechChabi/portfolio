import { getProfile } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stamp } from "@/components/ui/Stamp";
import { ContactForm } from "./ContactForm";
import {
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/ui/icons";

export async function ContactSection() {
  const profile = await getProfile();

  return (
    <section id="contact" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-site">
        <div className="rule-double" aria-hidden />
      </div>

      <div className="container-site pt-8">
        <div className="grid gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
          {/* Introduction + liens directs */}
          <div>
            <Reveal>
              <SectionHeading
                cote="DCB·2026·06"
                tone="accent"
                title="Une idée à verser au fonds ?"
                note="Dernière étape du cycle : détruire ou conserver. Je choisis de conserver — et de transmettre."
                description="Besoin d'organiser une mémoire documentaire, de dématérialiser un fonds, de construire un outil sur mesure ou d'analyser vos données — parlons-en."
              />
            </Reveal>

            <Reveal delay={0.1} className="mt-10">
              <ul className="divide-y divide-line-soft border-y border-line">
                {[
                  {
                    href: profile.linkedin_url,
                    icon: LinkedInIcon,
                    label: "LinkedIn",
                    note: "Connectons-nous professionnellement",
                  },
                  {
                    href: profile.github_url,
                    icon: GitHubIcon,
                    label: "GitHub",
                    note: "Le code, ouvert",
                  },
                  profile.email
                    ? {
                        href: `mailto:${profile.email}`,
                        icon: MailIcon,
                        label: "Email",
                        note: profile.email,
                      }
                    : null,
                ]
                  .filter((l): l is NonNullable<typeof l> => l !== null)
                  .map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 px-2 py-4 transition-colors duration-300 hover:bg-ink/[0.03]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center border border-ink/30 bg-surface text-accent-deep transition-colors duration-300 group-hover:border-accent/60">
                          <link.icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-ink">
                            {link.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-faint">
                            {link.note}
                          </span>
                        </span>
                        <span className="ml-auto text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent">
                          →
                        </span>
                      </a>
                    </li>
                  ))}
              </ul>

              <p className="mt-8 flex items-center gap-2.5 text-sm text-ink-dim">
                <MapPinIcon className="h-4 w-4 text-accent" />
                {profile.location} — disponible pour des missions à distance
                comme sur site.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-10 hidden lg:block">
              <Stamp
                top="COMMUNICATION"
                center="Ouvert"
                centerSub="RÉPONSE SOUS 48 H"
                bottom="ÉCRIVEZ — JE CLASSE"
                tone="green"
                size={118}
                tilt={-6}
                delay={0.4}
              />
            </Reveal>
          </div>

          {/* Formulaire */}
          <Reveal delay={0.15}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
