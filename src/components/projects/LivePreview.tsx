"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CloseIcon,
  ExpandIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

type LivePreviewProps = {
  /** URL du site à embarquer. */
  url: string;
  /** Nom du projet (libellés, aria). */
  title: string;
  /** Image de repli si le site refuse l'embed. */
  coverImage?: string;
};

type Phase = "idle" | "loading" | "loaded" | "failed";

const LOAD_TIMEOUT_MS = 8000;

/**
 * Aperçu live d'un projet dans une iframe, avec :
 * - chargement paresseux (l'iframe ne démarre qu'à l'approche du viewport) ;
 * - détection d'échec d'embed (X-Frame-Options / CSP) avec repli designé
 *   sur l'image de couverture ;
 * - mode plein écran (portal vers <body>) et ouverture dans un nouvel onglet.
 */
export function LivePreview({ url, title, coverImage }: LivePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visible, setVisible] = useState(false); // iframe approchée
  const [phase, setPhase] = useState<Phase>("idle");
  const [attempt, setAttempt] = useState(0); // force un remontage de l'iframe
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* L'iframe ne se charge que lorsqu'elle approche du viewport. */
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("loaded");
  }, []);

  /* Minuterie : si le site ne charge pas, on bascule sur le repli. */
  useEffect(() => {
    if (phase !== "loading") return;
    timerRef.current = setTimeout(() => {
      setPhase((p) => (p === "loading" ? "failed" : p));
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, attempt]);

  const startLoading = () => {
    setPhase("loading");
    setAttempt((a) => a + 1);
  };

  useEffect(() => {
    if (visible && phase === "idle") startLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const retry = () => {
    setPhase("loading");
    setAttempt((a) => a + 1);
  };

  /* Échap ferme le plein écran ; verrouille le scroll du corps. */
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const cover = coverImage || "/images/fallback-project.svg";
  const showFallback = phase === "failed";
  const showSpinner = phase === "idle" || phase === "loading";

  const iframe = (extraClass = "") => (
    <iframe
      key={attempt}
      src={url}
      title={`Aperçu live de ${title}`}
      loading="lazy"
      onLoad={handleLoad}
      className={`absolute inset-0 h-full w-full border-0 bg-white ${extraClass}`}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="fullscreen"
    />
  );

  const toolbar = (compact = false) => (
    <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 border border-ink/40" />
        <span className="h-2.5 w-2.5 border border-ink/40" />
        <span className="h-2.5 w-2.5 bg-accent" />
      </span>
      <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] tracking-[0.04em] text-ink-faint">
        {url.replace(/^https?:\/\//, "")}
      </span>
      <span className="flex items-center gap-1">
        {!compact && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="flex h-8 w-8 items-center justify-center border border-transparent text-ink-dim transition-colors hover:border-line hover:bg-surface hover:text-accent-deep"
            aria-label="Agrandir l'aperçu en plein écran"
            title="Plein écran"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center border border-transparent text-ink-dim transition-colors hover:border-line hover:bg-surface hover:text-accent-deep"
          aria-label={`Ouvrir ${title} dans un nouvel onglet`}
          title="Ouvrir dans un nouvel onglet"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      </span>
    </div>
  );

  return (
    <div ref={wrapperRef} className="not-prose">
      {/* Fenêtre navigateur */}
      <div className="overflow-hidden border border-ink/25 bg-surface shadow-card">
        {toolbar()}
        <div className="relative aspect-[16/10] w-full bg-bg-deep md:aspect-video">
          {visible && iframe()}

          {/* Voile de chargement */}
          {showSpinner && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-deep">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-onink/25 border-t-accent-soft" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-onink-faint">
                Chargement de l&apos;aperçu…
              </p>
            </div>
          )}

          {/* Repli : le site refuse l'embed */}
          {showFallback && (
            <div className="absolute inset-0">
              <Image
                src={cover}
                alt={`Capture d'écran de ${title}`}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="max-w-sm text-sm leading-relaxed text-ink-dim">
                  Ce site n&apos;autorise pas l&apos;affichage dans une fenêtre intégrée.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg-deep transition-colors hover:bg-accent-soft"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    Ouvrir en plein écran
                  </a>
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plein écran — portal hors de toute transformation parente */}
      {mounted &&
        fullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-bg-deep/95 p-3 backdrop-blur-sm md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Aperçu plein écran de ${title}`}
          >
            <div className="mx-auto flex h-full w-full max-w-[110rem] flex-col overflow-hidden border border-onink/20 bg-surface shadow-card">
              <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 border border-ink/40" />
                  <span className="h-2.5 w-2.5 border border-ink/40" />
                  <span className="h-2.5 w-2.5 bg-accent" />
                </span>
                <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] tracking-[0.04em] text-ink-faint">
                  {url.replace(/^https?:\/\//, "")}
                </span>
                <span className="flex items-center gap-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-transparent text-ink-dim transition-colors hover:border-line hover:bg-surface hover:text-accent-deep"
                    aria-label={`Ouvrir ${title} dans un nouvel onglet`}
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setFullscreen(false)}
                    className="flex h-8 w-8 items-center justify-center border border-transparent text-ink-dim transition-colors hover:border-line hover:bg-surface hover:text-accent-deep"
                    aria-label="Fermer le plein écran"
                    title="Fermer (Échap)"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </span>
              </div>
              <div className="relative flex-1 bg-white">
                <iframe
                  src={url}
                  title={`Aperçu plein écran de ${title}`}
                  className="absolute inset-0 h-full w-full border-0"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="fullscreen"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
