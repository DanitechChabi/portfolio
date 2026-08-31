import Link from "next/link";
import { getProfile } from "@/lib/data";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/ui/icons";

export async function Footer() {
  const profile = await getProfile();
  const year = new Date().getFullYear();

  return (
    /* Encre profonde — le verso de la feuille */
    <footer className="border-t border-onink/15 bg-bg-deep text-onink">
      <div className="container-site py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marque */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-onink/30 bg-bg-deep font-serif text-lg leading-none text-onink">
                D<span className="text-accent-soft">.</span>
              </span>
              <span className="font-serif text-[15px] tracking-tight text-onink">
                Daniel Chabi Bouko
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-onink-dim">
              {profile.tagline}
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-onink-faint">
              Archives <span className="text-accent-soft">·</span> Data{" "}
              <span className="text-cyan-soft">·</span> Dev
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation de pied de page">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-onink-faint">
              Index du fonds
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/#apropos", label: "À propos" },
                { href: "/#competences", label: "Compétences" },
                { href: "/#experiences", label: "Expériences" },
                { href: "/#projets", label: "Projets" },
                { href: "/blog", label: "Blog" },
                { href: "/#contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-onink-dim transition-colors hover:text-onink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Réseaux */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-onink-faint">
              Ailleurs
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-onink-dim transition-colors hover:text-onink"
                >
                  <LinkedInIcon className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-onink-dim transition-colors hover:text-onink"
                >
                  <GitHubIcon className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              {profile.email && (
                <li>
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2.5 text-onink-dim transition-colors hover:text-onink"
                  >
                    <MailIcon className="h-4 w-4" />
                    {profile.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-onink/15 pt-6 font-mono text-[11px] text-onink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="nums">
            © {year} {profile.name} — {profile.location}
          </p>
          <p>
            Le Registre —{" "}
            <span className="text-accent-soft">l&rsquo;archive, version 2.0</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
