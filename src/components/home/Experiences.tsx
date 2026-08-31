import { FORMATIONS, type Hat } from "@/content/parcours";
import { getExperiences } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Cote } from "@/components/ui/Cote";
import { Stamp } from "@/components/ui/Stamp";

type Tone = "accent" | "cyan" | "green";

const HAT_META: Record<Hat, { label: string; tone: Tone }> = {
  archives: { label: "Archives", tone: "accent" },
  data: { label: "Data", tone: "cyan" },
  dev: { label: "Dev", tone: "green" },
};

const TONE_BORDER: Record<Tone, string> = {
  accent: "border-accent/50 text-accent-deep",
  cyan: "border-cyan/50 text-cyan",
  green: "border-green/50 text-green",
};
const TONE_SQUARE: Record<Tone, string> = {
  accent: "bg-accent",
  cyan: "bg-cyan",
  green: "bg-green",
};

export async function Experiences() {
  /** Entrées triées de la plus récente à la plus ancienne. */
  const entries = await getExperiences();

  return (
    <section id="experiences" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-site">
        <div className="rule-double" aria-hidden />
      </div>

      <div className="container-site pt-8">
        <Reveal>
          <SectionHeading
            cote="DCB·2026·04"
            tone="accent"
            title="Le parcours, au registre"
            note="Cinq organisations, un même geste : mettre de l'ordre dans l'information et la rendre accessible."
            description="De la salle d'archives du Cabinet Bersi à la GED de la Clinique John Holt — chaque mission est une entrée du registre des services."
          />
        </Reveal>

        {/* En-tête du registre */}
        <Reveal className="mt-12 hidden md:block">
          <div className="grid grid-cols-[12rem_1fr_9rem] gap-8 border-b-2 border-ink pb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            <span>Période</span>
            <span>Mission</span>
            <span className="text-right">Casquettes</span>
          </div>
        </Reveal>

        {/* Registre des services */}
        <div>
          {entries.map((exp, i) => (
            <Reveal key={exp.id} delay={0.04 * i}>
              <article
                className={`grid gap-4 border-b border-line py-7 md:grid-cols-[12rem_1fr_9rem] md:gap-8 ${
                  exp.current ? "border-l-2 border-l-accent bg-accent/[0.03] pl-5 md:pl-6" : ""
                }`}
              >
                {/* Période */}
                <div>
                  <p className="nums font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
                    {exp.period}
                  </p>
                  {exp.current && (
                    <span className="mt-2 inline-block -rotate-2 border border-accent bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-deep">
                      En poste
                    </span>
                  )}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {exp.type} · {exp.location.split(",")[0]}
                  </p>
                  <Cote code={exp.cote} className="mt-1.5" />
                </div>

                {/* Mission */}
                <div>
                  <h3 className="font-serif text-xl leading-snug tracking-tight text-ink md:text-[1.35rem]">
                    {exp.role}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep">
                    {exp.org}
                  </p>
                  {exp.summary && (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim">
                      {exp.summary}
                    </p>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {exp.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-baseline gap-2.5 text-[13px] leading-relaxed text-ink-dim"
                        >
                          <span
                            className={`mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 ${
                              exp.hats[0]
                                ? TONE_SQUARE[HAT_META[exp.hats[0]].tone]
                                : "bg-accent"
                            }`}
                            aria-hidden
                          />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Casquettes */}
                <div className="flex flex-row flex-wrap gap-1.5 md:flex-col md:items-end md:gap-2">
                  {exp.hats.map((hat) => (
                    <span
                      key={hat}
                      className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${TONE_BORDER[HAT_META[hat].tone]}`}
                    >
                      {HAT_META[hat].label}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Formation */}
        <Reveal className="mt-16">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
              Formation &amp; certifications
            </p>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <p className="mt-4 max-w-xl font-serif text-[15px] italic leading-relaxed text-accent-deep">
            La licence a donné la méthode, la formation data a donné la lecture —
            le développement a donné l&rsquo;outil.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">
          {FORMATIONS.map((formation, i) => (
            <Reveal key={formation.cote} delay={0.08 * i}>
              <article className="relative h-full border border-ink/25 bg-surface p-6 pt-7 pr-6 shadow-card md:pr-28">
                <Stamp
                  top={formation.stamp.top}
                  center={formation.stamp.center}
                  bottom={formation.stamp.bottom}
                  tone={formation.tone}
                  size={104}
                  tilt={i === 0 ? -7 : 6}
                  delay={0.3 + 0.15 * i}
                  className="absolute -top-7 right-3 md:right-4"
                />
                <Cote code={formation.cote} />
                <h3 className="wonk mt-4 font-serif text-xl tracking-tight text-ink">
                  {formation.title}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-ink-dim">{formation.org}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  {formation.period}
                </p>
                {formation.detail && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-dim">{formation.detail}</p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
