"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

type AnnotationType = "underline" | "arrow" | "circle";

type AnnotationProps = {
  /** Trait d'annotation cyanotype. */
  type: AnnotationType;
  className?: string;
  /** Délai avant le tracé, en secondes. */
  delay?: number;
};

const PATHS: Record<AnnotationType, { d: string; viewBox: string; preserve?: boolean }> = {
  /* Soulignement à main levée — s'étire sur la largeur du parent */
  underline: {
    d: "M 3 8 C 40 3.5, 82 10.5, 118 6 S 182 8.5, 197 4.5",
    viewBox: "0 0 200 12",
  },
  /* Flèche courbe — pointe vers le haut à droite */
  arrow: {
    d: "M 5 52 C 28 56, 58 44, 76 14 M 76 14 l -9.5 6.5 M 76 14 l 1.5 11",
    viewBox: "0 0 100 60",
    preserve: true,
  },
  /* Boucle d'encerclement — tourne autour du contenu du parent */
  circle: {
    d: "M 28 40 C 24 8, 178 6, 183 38 C 187 68, 48 76, 30 50",
    viewBox: "0 0 200 80",
    preserve: true,
  },
};

/**
 * Annotations cyanotype — le geste du data analyst qui marque le
 * document : soulignés, flèches et boucles tracés au scroll.
 * La couleur est portée par le parent (ex. `text-cyan`).
 */
export function Annotation({ type, className = "", delay = 0 }: AnnotationProps) {
  const reduce = useReducedMotion();
  const { d, viewBox, preserve } = PATHS[type];

  const path = (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={type === "underline" ? 2.6 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    />
  );

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserve ? "xMidYMid meet" : "none"}
      aria-hidden
      className={className}
    >
      {path}
    </svg>
  );
}
