type Tone = "ink" | "accent" | "cyan" | "green";

const TONE_TEXT: Record<Tone, string> = {
  ink: "text-ink-dim",
  accent: "text-accent",
  cyan: "text-cyan",
  green: "text-green",
};

type CoteProps = {
  /** Cote complète, séparateurs « · » inclus — ex. « DCB·2026·02 ». */
  code: string;
  /** Libellé de contexte devant la cote — ex. « Cote ». */
  label?: string;
  tone?: Tone;
  className?: string;
};

/**
 * Cote d'archive — le système de repérage du site. Chaque section,
 * chaque projet, chaque expérience porte sa cote, comme dans un
 * inventaire de fonds.
 */
export function Cote({ code, label, tone = "ink", className = "" }: CoteProps) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.22em] ${TONE_TEXT[tone]} ${className}`}
    >
      {label && <span className="text-ink-faint">{label}</span>}
      <span className="nums">
        {code.split("·").map((part, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-[0.15em] text-accent/70">·</span>}
            {part}
          </span>
        ))}
      </span>
    </p>
  );
}
