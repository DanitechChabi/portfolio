import { getSkills } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Cote } from "@/components/ui/Cote";
import { SkillNotches } from "./SkillNotches";

type Tone = "accent" | "cyan" | "green";

/** Identifiant du pôle (un chapeau métier) — distinct de son encre (tone). */
type PoleKey = "archives" | "data" | "dev";

type Pole = {
  key: PoleKey;
  title: string;
  cote: string;
  tone: Tone;
  /** Catégories (store Blob ou défaut) rattachées à ce pôle. */
  matches: string[];
  /** Ce que ce pôle apporte au reste du parcours. */
  role: string;
};

/** Les trois pôles de compétences — une encre chacun. */
const POLES: Pole[] = [
  {
    key: "archives",
    title: "Archivistique & GED",
    cote: "CMP·A·01",
    tone: "accent",
    matches: ["Archivistique", "Archivistique & GED", "GED", "Archives"],
    role: "La mémoire — structurer, classer, conserver",
  },
  {
    key: "data",
    title: "Data & analyse",
    cote: "CMP·D·02",
    tone: "cyan",
    matches: ["Data", "Data & analyse", "Data Analyst", "Analyse"],
    role: "La lecture — faire parler les données",
  },
  {
    key: "dev",
    title: "Développement web",
    cote: "CMP·V·03",
    tone: "green",
    matches: ["Développement web", "Développement", "Dev", "Web"],
    role: "L'outil — construire les systèmes",
  },
];

const TONE_BORDER: Record<Tone, string> = {
  accent: "border-accent",
  cyan: "border-cyan",
  green: "border-green",
};
const TONE_BG: Record<Tone, string> = {
  accent: "bg-accent",
  cyan: "bg-cyan",
  green: "bg-green",
};
const TONE_HOVER: Record<Tone, string> = {
  accent: "hover:bg-accent/[0.04]",
  cyan: "hover:bg-cyan/[0.04]",
  green: "hover:bg-green/[0.04]",
};
const TONE_TEXT: Record<Tone, string> = {
  accent: "text-accent-deep",
  cyan: "text-cyan",
  green: "text-green",
};

export async function Skills() {
  const skills = await getSkills();

  /* Rangement des compétences par pôle ; les catégories inconnues
     partent dans un registre divers (rare — catégories admin). */
  const byPole = POLES.map((pole) => ({
    pole,
    items: skills.filter(
      (s) => pole.matches.includes(s.category) || pole.matches.some((m) => s.category.startsWith(m)),
    ),
  }));
  const known = new Set(byPole.flatMap(({ items }) => items.map((s) => s.id)));
  const divers = skills.filter((s) => !known.has(s.id));

  return (
    <section id="competences" className="relative scroll-mt-24 py-24 md:py-32">
      {/* filet double de registre */}
      <div className="container-site">
        <div className="rule-double" aria-hidden />
      </div>

      <div className="container-site pt-8">
        <Reveal>
          <SectionHeading
            cote="DCB·2026·03"
            tone="accent"
            title="Inventaire des compétences"
            note="Trois pôles, trois encres — mais une seule écriture : celle de l'information."
            description="La rigueur de l'archivistique, la lecture des données, la construction des outils : chaque pôle nourrit les deux autres."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {byPole.map(({ pole, items }, i) => (
            <Reveal key={pole.key} delay={0.08 * i}>
              <article className="h-full border border-ink/25 bg-surface shadow-card">
                {/* En-tête du registre */}
                <header
                  className={`border-b-2 px-6 pb-4 pt-5 ${TONE_BORDER[pole.tone]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Cote code={pole.cote} />
                      <h3 className="wonk mt-2 font-serif text-xl tracking-tight text-ink">
                        {pole.title}
                      </h3>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rotate-45 ${TONE_BG[pole.tone]}`}
                      aria-hidden
                    />
                  </div>
                  <p className={`mt-2 font-serif text-[13px] italic ${TONE_TEXT[pole.tone]}`}>
                    {pole.role}
                  </p>
                </header>

                {/* Lignes d'inventaire */}
                <ul>
                  {items.map((skill) => (
                    <li
                      key={skill.id}
                      className={`flex items-baseline gap-3 border-b border-line-soft px-6 py-3.5 transition-colors duration-200 last:border-b-0 ${TONE_HOVER[pole.tone]}`}
                    >
                      <span className="text-sm text-ink">{skill.name}</span>
                      <span className="leader" aria-hidden />
                      <SkillNotches level={skill.level} tone={pole.tone} />
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="px-6 py-4 text-sm text-ink-faint">
                      Registre en cours de constitution…
                    </li>
                  )}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Registre divers — catégories non rattachées */}
        {divers.length > 0 && (
          <Reveal className="mt-6">
            <div className="border border-dashed border-line px-6 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
                Divers
              </p>
              <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-dim">
                {divers.map((s) => (
                  <span key={s.id}>{s.name}</span>
                ))}
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
