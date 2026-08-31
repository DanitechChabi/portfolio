"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * Barre de progression de lecture, fixée en haut de la page.
 * Suit le scroll avec un léger ressort — et disparaît si le
 * mouvement est réduit.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  if (reduce) return null;

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-accent-deep via-accent to-accent-soft"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
