import { Cote } from "./Cote";

type Tone = "accent" | "cyan" | "green";

const TONE_NOTE: Record<Tone, string> = {
  accent: "text-accent-deep",
  cyan: "text-cyan",
  green: "text-green",
};

type SectionHeadingProps = {
  /** Cote du fonds documentaire — ex. « DCB·2026·02 ». */
  cote: string;
  /** Titre (texte simple, ou fragments enrichis d'annotations). */
  title: React.ReactNode;
  /** Note marginale du registre, en italique serif. */
  note?: string;
  description?: string;
  /** Encre dominante de la section. */
  tone?: Tone;
  align?: "left" | "center";
};

/**
 * En-tête de section façon inventaire : cote d'archive, filet,
 * titre en serif, note marginale. Chaque section du site est une
 * entrée du registre.
 */
export function SectionHeading({
  cote,
  title,
  note,
  description,
  tone = "accent",
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "text-center" : ""}>
      <div
        className={`flex items-center gap-4 ${
          centered ? "justify-center" : ""
        }`}
      >
        <Cote code={cote} label="Cote" tone="ink" />
        <span className="h-px flex-1 bg-line" aria-hidden />
        {!centered && (
          <span className="h-[5px] w-[5px] rotate-45 bg-accent/70" aria-hidden />
        )}
      </div>

      <h2 className="wonk mt-6 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink md:text-[2.6rem] md:leading-[1.1]">
        {title}
      </h2>

      {note && (
        <p
          className={`mt-4 font-serif text-[15px] italic leading-relaxed ${TONE_NOTE[tone]}`}
        >
          {note}
        </p>
      )}

      {description && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-dim">
          {description}
        </p>
      )}
    </div>
  );
}
