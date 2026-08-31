type MarqueeProps = {
  /** Verbes du cycle de l'information, dans l'ordre. */
  items: string[];
  className?: string;
};

function Track({ items, ariaHidden = false }: { items: string[]; ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-ink-dim">
            {item}
          </span>
          <span className="mx-7 inline-block h-1.5 w-1.5 rotate-45 bg-accent/70" aria-hidden />
        </span>
      ))}
    </div>
  );
}

/**
 * Bande de liaison — le tapis roulant des verbes du cycle de
 * l'information (trier → classer → analyser → développer…).
 * Défile lentement, se fige au survol, s'arrête si le mouvement
 * est réduit (règle globale).
 */
export function Marquee({ items, className = "" }: MarqueeProps) {
  return (
    <div
      className={`relative overflow-hidden border-y border-ink/80 bg-surface py-3.5 ${className}`}
      role="presentation"
    >
      {/* filet double de registre */}
      <span className="pointer-events-none absolute inset-x-0 top-[3px] h-px bg-ink/60" aria-hidden />
      <span className="pointer-events-none absolute inset-x-0 bottom-[3px] h-px bg-ink/60" aria-hidden />
      <div className="marquee-track">
        <Track items={items} />
        <Track items={items} ariaHidden />
      </div>
    </div>
  );
}
