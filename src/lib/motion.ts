import type { Variants } from "motion/react";

/** Easing signature du site — sortie douce, presque "papier". */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Apparition vers le haut, utilisée par Reveal et les sections. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

/** Conteneur pour animer des enfants en cascade. */
export const stagger: Variants = {
  hidden: {},
  visible: (delay: number = 0) => ({
    transition: { staggerChildren: 0.08, delayChildren: delay },
  }),
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};
