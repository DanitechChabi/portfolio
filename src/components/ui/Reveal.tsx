"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Décalage en secondes avant l'animation. */
  delay?: number;
  /** Distance verticale de départ en pixels. */
  y?: number;
};

/**
 * Fait apparaître un bloc lorsqu'il entre dans le viewport.
 * Rend un simple div sans animation si le mouvement est réduit.
 */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
