"use client";

import { useState } from "react";
import type { LanguageShare } from "@/lib/github";
import {
  colorsForLanguages,
  formatBytes,
  formatShare,
} from "@/lib/chart-palette";

type LanguageBarProps = {
  /** Parts de code, triées par volume décroissant. */
  languages: LanguageShare[];
  /** Étiquette accessible de l'ensemble — ex. « Composition du code ». */
  label?: string;
};

/**
 * Barre empilée de la composition du code d'un projet (octets par
 * langage). Segments séparés par un interstice de 2 px de surface,
 * infobulle au survol de chaque segment, clé de lecture complète sous
 * la barre — l'identité ne repose jamais sur la couleur seule.
 */
export function LanguageBar({ languages, label = "Composition du code" }: LanguageBarProps) {
  const [active, setActive] = useState<number | null>(null);
  const colors = colorsForLanguages(languages);

  if (languages.length === 0) {
    return (
      <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        <span className="h-2.5 w-16 border border-dashed border-line" aria-hidden />
        non ventilé
      </p>
    );
  }

  const ariaLabel = `${label} : ${languages
    .map((l) => `${l.name} ${formatShare(l.share)}`)
    .join(", ")}`;

  /* Centre de chaque segment, en pourcentage de la largeur — cumul des
     parts précédentes recomputé à plat, sans mutation pendant le rendu. */
  const centers = languages.map((language, i) => {
    const start = languages.slice(0, i).reduce((sum, l) => sum + l.share, 0);
    return Math.min(92, Math.max(8, (start + language.share / 2) * 100));
  });

  return (
    <div className="w-full">
      <div className="relative" onMouseLeave={() => setActive(null)}>
        {/* Barre — l'aire de survol est plus haute que le segment lui-même */}
        <div
          className="flex items-center gap-[2px]"
          role="img"
          aria-label={ariaLabel}
        >
          {languages.map((language, i) => (
            <div
              key={language.name}
              className="flex h-6 min-w-[3px] items-center"
              style={{ flex: `${language.share} 1 0%` }}
              onMouseEnter={() => setActive(i)}
            >
              <span
                className="block h-2.5 w-full"
                style={{ backgroundColor: colors[i] }}
                aria-hidden
              />
            </div>
          ))}
        </div>

        {/* Infobulle du segment survolé */}
        {active !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-onink/20 bg-bg-deep px-2.5 py-1.5 text-center"
            style={{ left: `${centers[active]}%` }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-onink-dim">
              {languages[active].name}
            </p>
            <p className="text-xs font-medium text-onink">
              {formatShare(languages[active].share)}{" "}
              <span className="font-normal text-onink-faint">
                · {formatBytes(languages[active].bytes)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Clé de lecture — carré de couleur + libellé, texte en encre */}
      <ul className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {languages.map((language, i) => (
          <li
            key={language.name}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-dim"
          >
            <span
              className="h-2.5 w-2.5 border border-ink/20"
              style={{ backgroundColor: colors[i] }}
              aria-hidden
            />
            {language.name}
            <span className="text-ink-faint">{formatShare(language.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
