import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      {/* Filigrane */}
      <span
        className="pointer-events-none select-none font-serif text-[10rem] italic leading-none text-accent/10"
        aria-hidden
      >
        404
      </span>

      <p className="relative -mt-16 text-xs font-medium uppercase tracking-[0.24em] text-accent">
        Document introuvable
      </p>
      <h1 className="relative mt-4 font-serif text-3xl tracking-tight text-ink md:text-4xl">
        Cette page a été déclassée
      </h1>
      <p className="relative mt-4 max-w-md text-sm leading-relaxed text-ink-dim">
        L&apos;adresse demandée n&apos;existe pas (ou n&apos;existe plus). Le reste des
        archives, lui, est bien conservé.
      </p>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-bg-deep transition-colors hover:bg-accent-soft"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/blog"
          className="rounded-full border border-line px-6 py-3 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft"
        >
          Lire le blog
        </Link>
      </div>
    </div>
  );
}
