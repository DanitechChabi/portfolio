"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

type Tone = "accent" | "cyan" | "green";

const TONE_FILL: Record<Tone, string> = {
  accent: "bg-accent",
  cyan: "bg-cyan",
  green: "bg-green",
};

const LEVEL_LABELS: Record<number, string> = {
  5: "Expert",
  4: "Avancé",
  3: "Intermédiaire",
  2: "Notions +",
  1: "Notions",
};

/** Carrés de niveau — notation « coup de tampon » sur cinq. */
export function SkillNotches({ level, tone }: { level: number; tone: Tone }) {
  const reduce = useReducedMotion();
  const label = LEVEL_LABELS[level] ?? LEVEL_LABELS[3];

  return (
    <span
      className="flex shrink-0 items-center gap-1.5"
      role="img"
      aria-label={`Niveau ${label} — ${level} sur 5`}
    >
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:inline">
        {label}
      </span>
      <span className="flex items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <motion.span
            key={i}
            className={`h-2.5 w-2.5 border ${
              i < level ? `${TONE_FILL[tone]} border-transparent` : "border-line bg-transparent"
            }`}
            initial={reduce ? { scale: 1 } : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
          />
        ))}
      </span>
    </span>
  );
}
