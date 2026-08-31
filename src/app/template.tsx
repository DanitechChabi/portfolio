"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

/**
 * Transition de page : fondu + glissement léger vers le haut,
 * coupé lorsque l'utilisateur préfère réduire les animations.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
