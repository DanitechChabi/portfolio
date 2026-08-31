"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { CloseIcon } from "@/components/ui/icons";
import { Cote } from "@/components/ui/Cote";
import { Stamp } from "@/components/ui/Stamp";

/**
 * Popup d'inscription à la newsletter « Le Bordereau » — une fiche
 * d'abonnement qui se présente d'elle-même après 8 secondes de lecture,
 * 30 % de page parcourue ou une intention de sortie (curseur qui fuit
 * vers le haut de la fenêtre, ordinateur seulement).
 *
 * Mémoire locale (`localStorage`) : un refus calme le popup 7 jours, une
 * inscription le fait disparaître définitivement. Le lien « Newsletter »
 * du pied de page rouvre la fiche à la demande, mémoire ou pas — via
 * l'évènement {@link NEWSLETTER_OPEN_EVENT}.
 *
 * Accessibilité : dialogue modal (rôle, libellé, Échap), piège de focus
 * léger et défilement de la page bloqué tant que la fiche est ouverte.
 * `prefers-reduced-motion` coupe la mise en scène (ressort, tampon,
 * éclaboussures) et ne laisse que les fondus.
 */

/** Évènement ouvrant le popup depuis l'extérieur (lien du pied de page). */
export const NEWSLETTER_OPEN_EVENT = "dcb:newsletter-open";

const STORAGE_KEY = "dcb-newsletter";
/** Réapparition après un refus : 7 jours. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** Ouverture automatique après 8 secondes de lecture… */
const SHOW_AFTER_MS = 8_000;
/** …ou après avoir parcouru 30 % de la page… */
const SCROLL_RATIO = 0.3;
/** …ou quand le curseur quitte la fenêtre par le haut (intention de sortie). */
const EXIT_INTENT_Y = 8;

type Memory = { status: "dismissed" | "subscribed"; at: number };

function readMemory(): Memory | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Memory | null;
    if (parsed?.status !== "dismissed" && parsed?.status !== "subscribed") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeMemory(status: Memory["status"]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, at: Date.now() }));
  } catch {
    /* Stockage indisponible (navigation privée…) : le popup sera simplement
       un peu moins discret au fil des pages — sans gravité. */
  }
}

type Status = "idle" | "sending" | "success" | "error";

const FIELD =
  "w-full border border-ink/30 bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/* ------------------------------------------------------------------ */
/*  Mise en scène                                                      */
/* ------------------------------------------------------------------ */

/** Poussières en suspension dans le voile — la lumière d'une réserve. */
function Dust() {
  /* Positions déterministes (déduites de l'index) : rien d'aléatoire qui
     pourrait différer entre deux rendus. */
  const motes = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        left: 7 + ((i * 37 + 11) % 86),
        top: 9 + ((i * 53 + 23) % 82),
        size: 2 + (i % 3),
        dur: 7 + (i % 5) * 1.8,
        delay: (i % 4) * 1.4,
        drift: 12 + (i % 4) * 7,
      })),
    [],
  );

  return (
    <span className="pointer-events-none absolute inset-0 block overflow-hidden" aria-hidden>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-surface/60"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size }}
          animate={{ y: [0, -m.drift, 0], opacity: [0, 0.65, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** Titre révélé lettre à lettre — l'encre monte sur la ligne de base. */
function InkTitle({ text }: { text: string }) {
  return (
    <span className="inline-flex overflow-hidden pb-1 align-bottom" aria-hidden>
      {Array.from(text).map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{ y: "112%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.28 + i * 0.035, ease: EASE }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}

/** Éclaboussure d'encre — giclée radiale au coup de tampon. */
function Splatter() {
  const drops = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.22;
        const dist = 56 + ((i * 29) % 54);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 2.5 + ((i * 7) % 6),
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {drops.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-accent"
          style={{ width: d.size, height: d.size, marginLeft: -d.size / 2, marginTop: -d.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: d.x, y: d.y, scale: 1, opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.8, delay: 0.46, ease: EASE }}
        />
      ))}
    </div>
  );
}

/** Onde d'impact — le cercle d'encre qui se propage depuis le tampon. */
function ImpactRing() {
  return (
    <motion.span
      className="pointer-events-none absolute left-1/2 top-1/2 h-[150px] w-[150px] rounded-full border-2 border-accent/70"
      style={{ x: "-50%", y: "-50%" }}
      initial={{ scale: 0.55, opacity: 0 }}
      animate={{ scale: 2.1, opacity: [0, 0.75, 0] }}
      transition={{ duration: 0.9, delay: 0.42, ease: EASE }}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/*  La fiche                                                           */
/* ------------------------------------------------------------------ */

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoShown = useRef(false);
  const reduce = useReducedMotion();
  /* Miroir de `status` pour Échap : le handler doit lire l'état courant,
     pas celui capturé à l'ouverture de la fiche. */
  const statusRef = useRef<Status>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /* ---- Déclenchement : temporisation, défilement, sortie, lien du pied ---- */
  useEffect(() => {
    const memory = readMemory();
    const cooldownOver =
      memory?.status !== "dismissed" ||
      Date.now() - memory.at >= DISMISS_COOLDOWN_MS;
    const canAutoShow = memory?.status !== "subscribed" && cooldownOver;

    const tryOpen = () => {
      if (autoShown.current) return;
      autoShown.current = true;
      setOpen(true);
    };

    let timer: number | undefined;
    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= SCROLL_RATIO) {
        tryOpen();
      }
    };
    /* Intention de sortie : le curseur quitte la fenêtre par le haut —
       sur pointeur fin seulement (pas de « sortie » sur écran tactile). */
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= EXIT_INTENT_Y) tryOpen();
    };
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (canAutoShow) {
      timer = window.setTimeout(tryOpen, SHOW_AFTER_MS);
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!coarsePointer) {
        document.addEventListener("mouseout", onMouseOut);
      }
    }

    /* Ouverture manuelle : toujours possible, même refroidi. */
    const onOpenEvent = () => setOpen(true);
    window.addEventListener(NEWSLETTER_OPEN_EVENT, onOpenEvent);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener(NEWSLETTER_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  /* ---- Modale ouverte : Échap, piège de focus, défilement bloqué ---- */
  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const FOCUSABLES =
      'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const dismiss = () => {
      if (statusRef.current !== "success") writeMemory("dismissed");
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab") return;
      /* Piège de focus léger : le Tab boucle dans la fiche. */
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLES);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
      previous?.focus?.();
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          website: data.get("website"),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "L'inscription a échoué. Réessayez plus tard.");
      }
      setStatus("success");
      writeMemory("subscribed");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "L'inscription a échoué. Réessayez plus tard.",
      );
    }
  }

  /** Fermeture manuelle : un refus (hors succès) refroidit le popup 7 jours. */
  function close() {
    if (status !== "success") writeMemory("dismissed");
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="newsletter-titre"
        >
          {/* Voile — encre profonde, poussière en suspension */}
          <motion.button
            type="button"
            aria-label="Fermer la fiche d'abonnement"
            onClick={close}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-default bg-bg-deep/80 backdrop-blur-md"
          >
            {/* Vignette — le regard retombe sur la fiche */}
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 38%, transparent 32%, rgba(14,11,6,0.38) 100%)",
              }}
              aria-hidden
            />
            {!reduce && <Dust />}
          </motion.button>

          {/* La fiche — papier ivoire, talon détachable */}
          <motion.div
            ref={dialogRef}
            initial={reduce ? false : { opacity: 0, y: 64, scale: 0.93, rotate: -1.6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{
              opacity: 0,
              y: 28,
              scale: 0.96,
              transition: { duration: 0.22, ease: "easeOut" },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 27, mass: 0.95 }}
            className="relative w-full max-w-md border border-ink/25 bg-surface shadow-[0_36px_90px_-28px_rgba(18,14,8,0.55)]"
          >
            {/* Tampon fantôme — filigrane d'encre sur le papier */}
            {!reduce && (
              <Stamp
                top="PORTFOLIO · DCB"
                center="B"
                centerSub="LE BORDEAU"
                bottom="ABONNEMENT"
                size={200}
                tilt={11}
                className="pointer-events-none absolute -right-14 -top-16 opacity-[0.05] select-none"
              />
            )}

            {/* Secousse du papier au coup de tampon (succès) */}
            <motion.div
              animate={
                !reduce && status === "success"
                  ? { x: [0, -7, 7, -4, 2, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.5, delay: 0.42, ease: "easeOut" }}
            >
              {status === "success" ? (
                <div className="flex flex-col items-center px-7 pb-8 pt-11 text-center sm:px-9">
                  <div className="relative flex items-center justify-center">
                    <Stamp
                      top="PORTFOLIO · DCB"
                      center="Inscrit"
                      centerSub="ABONNÉ·E"
                      bottom="MERCI"
                      size={122}
                      tilt={-7}
                      delay={0.15}
                    />
                    {!reduce && (
                      <>
                        <ImpactRing />
                        <Splatter />
                      </>
                    )}
                  </div>
                  <motion.h2
                    id="newsletter-titre"
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.62, ease: EASE }}
                    className="wonk mt-6 font-serif text-2xl text-ink"
                  >
                    C&rsquo;est versé au registre
                  </motion.h2>
                  <motion.p
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.74, ease: EASE }}
                    className="mt-3 text-sm leading-relaxed text-ink-dim"
                  >
                    Merci&nbsp;! Le prochain <em>Le Bordereau</em> arrivera dans
                    votre boîte en début de mois.
                  </motion.p>
                  <motion.button
                    type="button"
                    onClick={() => setOpen(false)}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.88 }}
                    whileHover={reduce ? undefined : { scale: 1.02 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    className="mt-7 border border-ink/40 px-6 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent-deep"
                  >
                    Fermer
                  </motion.button>
                </div>
              ) : (
                <div>
                  {/* Talon — en-tête détachable, ligne de déchirure pointillée */}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dashed border-ink/35 px-7 pb-4 pt-5 sm:px-9">
                    <Cote code="DCB·2026·07" label="Fiche d'abonnement" tone="accent" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                      Le Bordereau · mensuel
                    </span>
                  </div>

                  <div className="relative px-7 pb-7 pt-6 sm:px-9">
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Fermer"
                      className="absolute right-3.5 top-0 flex h-8 w-8 items-center justify-center border border-ink/20 text-ink-dim transition-all duration-300 hover:rotate-90 hover:border-accent hover:text-accent"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>

                    <h2
                      id="newsletter-titre"
                      className="wonk mt-2 font-serif text-[1.7rem] leading-tight text-ink"
                    >
                      <span className="sr-only">Le Bordereau</span>
                      {reduce ? "Le Bordereau" : <InkTitle text="Le Bordereau" />}
                    </h2>
                    <motion.p
                      initial={reduce ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.55, ease: EASE }}
                      className="mt-2.5 max-w-[34ch] text-sm leading-relaxed text-ink-dim"
                    >
                      Une lettre mensuelle&nbsp;: nouveaux articles, dépôts GitHub et
                      coulisses du Registre — versés en une seule page.
                    </motion.p>

                    <motion.form
                      onSubmit={handleSubmit}
                      className="mt-6"
                      initial={reduce ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.68, ease: EASE }}
                    >
                      <label
                        htmlFor="newsletter-email"
                        className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint"
                      >
                        Adresse email
                      </label>
                      <input
                        ref={inputRef}
                        id="newsletter-email"
                        name="email"
                        type="email"
                        required
                        maxLength={200}
                        autoComplete="email"
                        placeholder="vous@exemple.com"
                        className={FIELD}
                      />

                      {/* Honeypot — invisible pour les humains */}
                      <div className="absolute -left-[9999px]" aria-hidden="true">
                        <label htmlFor="newsletter-website">Site web</label>
                        <input
                          id="newsletter-website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      <AnimatePresence>
                        {status === "error" && error && (
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-accent-deep"
                            role="alert"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={status === "sending"}
                        whileHover={reduce ? undefined : { scale: 1.015 }}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2.5 border border-accent bg-accent px-7 py-3 text-sm font-medium text-bg-deep transition-colors duration-300 hover:bg-accent-deep hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {status === "sending" && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-deep/30 border-t-bg-deep" />
                        )}
                        {status === "sending" ? "Inscription…" : "S'inscrire"}
                      </motion.button>

                      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
                        Un email par mois, pas davantage. Votre adresse ne quitte
                        jamais le fonds.
                      </p>
                    </motion.form>

                    <motion.button
                      type="button"
                      onClick={close}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="mt-4 w-full text-center text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-dim hover:underline"
                    >
                      Non merci, une autre fois
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
