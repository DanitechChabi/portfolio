type Tone = "default" | "accent" | "cyan" | "green";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-line bg-surface text-ink-dim hover:border-accent/40 hover:text-ink",
  accent: "border-accent/40 bg-accent/10 text-accent-deep hover:border-accent/70",
  cyan: "border-cyan/35 bg-cyan/10 text-cyan hover:border-cyan/70",
  green: "border-green/35 bg-green/10 text-green hover:border-green/70",
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

/** Étiquette de registre (technos, casquettes…), teintée par encre. */
export function Badge({ children, tone = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-300 ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
