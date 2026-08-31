"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { CloseIcon } from "@/components/ui/icons";
import { Cote } from "@/components/ui/Cote";
import { Stamp } from "@/components/ui/Stamp";

/**
 * Popup d'inscription à la newsletter « Le Bordereau » — une fiche
 * d'abonnement qui se présente d'elle-même après 20 secondes de lecture
 * ou 55 % de page parcourue, une fois au plus.
 *
 * Mémoire locale (`localStorage`) : un refus calme le popup 7 jours, une
 * inscription le fait disparaître définitivement. Le lien « Newsletter »
 * du pied de page rouvre la fiche à la demande, mémoire ou pas — via
 * l'évènement {@link NEWSLETTER_OPEN_EVENT}.
 *
 * Accessibilité : dialogue modal (rôle, libellé, Échap), piège de focus
 * léger et défilement de la page bloqué tant que la fiche est ouverte.
 */

/** Évènement ouvrant le popup depuis l'extérieur (lien du pied de page). */
export const NEWSLETTER_OPEN_EVENT = "dcb:newsletter-open";

const STORAGE_KEY = "dcb-newsletter";
/** Réapparition après un refus : 7 jours. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** Ouverture automatique après 20 secondes de lecture… */
const SHOW_AFTER_MS = 20_000;
/** …ou après avoir parcouru 55 % de la page. */
const SCROLL_RATIO = 0.55;

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
  "w-full border border-ink/30 bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 transition-colors focus:border-accent focus:outline-none";

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

  /* ---- Déclenchement : temporisation, défilement, lien du pied de page ---- */
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

    if (canAutoShow) {
      timer = window.setTimeout(tryOpen, SHOW_AFTER_MS);
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* Ouverture manuelle : toujours possible, même refroidi. */
    const onOpenEvent = () => setOpen(true);
    window.addEventListener(NEWSLETTER_OPEN_EVENT, onOpenEvent);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
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
          {/* Voile — encre profonde */}
          <motion.button
            type="button"
            aria-label="Fermer la fiche d'abonnement"
            onClick={close}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-default bg-bg-deep/70 backdrop-blur-[2px]"
          />

          {/* La fiche — papier ivoire */}
          <motion.div
            ref={dialogRef}
            initial={reduce ? false : { opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative w-full max-w-md border border-ink/25 bg-surface shadow-card"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center border border-ink/20 text-ink-dim transition-colors hover:border-accent hover:text-accent"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center px-7 pb-8 pt-10 text-center sm:px-9">
                <Stamp
                  top="PORTFOLIO · DCB"
                  center="Inscrit"
                  centerSub="ABONNÉ·E"
                  bottom="MERCI"
                  size={118}
                  tilt={-7}
                />
                <h2
                  id="newsletter-titre"
                  className="wonk mt-6 font-serif text-2xl text-ink"
                >
                  C&rsquo;est versé au registre
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                  Merci&nbsp;! Le prochain <em>Le Bordereau</em> arrivera dans
                  votre boîte en début de mois.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-7 border border-ink/40 px-6 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent-deep"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="px-7 pb-7 pt-8 sm:px-9">
                <Cote code="DCB·2026·07" label="Fiche d'abonnement" tone="accent" />

                <h2
                  id="newsletter-titre"
                  className="wonk mt-4 font-serif text-[1.7rem] leading-tight text-ink"
                >
                  Le Bordereau
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">
                  Une lettre mensuelle&nbsp;: nouveaux articles, dépôts GitHub et
                  coulisses du Registre — versés en une seule page.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
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

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2.5 border border-accent bg-accent px-7 py-3 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-deep hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "sending" && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-deep/30 border-t-bg-deep" />
                    )}
                    {status === "sending" ? "Inscription…" : "S'inscrire"}
                  </button>

                  <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
                    Un email par mois, pas davantage. Votre adresse ne quitte
                    jamais le fonds.
                  </p>
                </form>

                <button
                  type="button"
                  onClick={close}
                  className="mt-4 w-full text-center text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-dim hover:underline"
                >
                  Non merci, une autre fois
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
