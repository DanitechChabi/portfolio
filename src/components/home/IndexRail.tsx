"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const ENTRIES = [
  { num: "02", label: "À propos", note: "La fiche", target: "#apropos" },
  { num: "03", label: "Compétences", note: "L'inventaire", target: "#competences" },
  { num: "04", label: "Expériences", note: "Le registre", target: "#experiences" },
  { num: "05", label: "Projets", note: "Le fonds", target: "#projets" },
  { num: "06", label: "Contact", note: "La communication", target: "#contact" },
];

/**
 * Rail latéral : l'index du fonds. Suit la position du scroll, indique
 * l'entrée courante et permet de sauter d'une section à l'autre.
 * Réservé aux très grands écrans.
 */
export function IndexRail() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const targets = ENTRIES.map((s) => document.querySelector(s.target)).filter(
      (el): el is Element => el !== null,
    );
    if (targets.length === 0) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const threshold = window.innerHeight * 0.45;
        let current = 0;
        targets.forEach((el, i) => {
          if (el.getBoundingClientRect().top <= threshold) current = i;
        });
        setActive(current);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (target: string) => {
    document
      .querySelector(target)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const progress = (active / (ENTRIES.length - 1)) * 100;

  return (
    <nav
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
      aria-label="Index du fonds"
    >
      <ol className="relative flex flex-col gap-6">
        {/* Ligne de fond + progression */}
        <span
          className="absolute left-[calc(100%-5px)] top-2 h-[calc(100%-16px)] w-px bg-line"
          aria-hidden
        />
        <span
          className="absolute left-[calc(100%-5px)] top-2 w-px bg-accent transition-all duration-700"
          style={{ height: `calc(${progress}% * ${(ENTRIES.length - 1) / ENTRIES.length})` }}
          aria-hidden
        />

        {ENTRIES.map((entry, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <li key={entry.num} className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => goTo(entry.target)}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center gap-3 py-1"
                aria-label={`Section ${entry.num} — ${entry.label}`}
              >
                {/* Libellé : visible pour l'entrée active et au survol */}
                <span
                  className={`whitespace-nowrap text-right transition-all duration-300 ${
                    isActive
                      ? "translate-x-0 opacity-100"
                      : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-80"
                  } hidden min-[1440px]:block`}
                >
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    {entry.num} · {entry.note}
                  </span>
                  <span
                    className={`block font-serif text-sm ${
                      isActive ? "text-accent-deep" : "text-ink-dim"
                    }`}
                  >
                    {entry.label}
                  </span>
                </span>

                {/* Point */}
                <span
                  className={`relative z-10 h-2.5 w-2.5 rotate-45 border transition-all duration-300 ${
                    isActive
                      ? "scale-110 border-accent bg-accent"
                      : isPast
                        ? "border-accent/60 bg-accent/40 group-hover:scale-110"
                        : "border-line bg-bg group-hover:scale-110 group-hover:border-accent/50"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
