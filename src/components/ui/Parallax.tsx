"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Amplitude du déplacement en pixels (le contenu descend puis remonte). */
  amount?: number;
};

/**
 * Parallax générique piloté par le scroll : le contenu glisse de
 * +amount à −amount px pendant qu'il traverse le viewport.
 * Superposer plusieurs Parallax d'amplitudes différentes crée la
 * profondeur. Sans effet si le mouvement est réduit.
 */
export function Parallax({ children, className, amount = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
