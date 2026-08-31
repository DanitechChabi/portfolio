"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { EASE } from "@/lib/motion";

const INTERACTIVE =
  "a, button, [role='button'], input, textarea, select, summary, label, [data-crosshair]";

/* « Pointeur fin » (souris) — état externe lu via media query, sans
   setState dans un effect. */
function subscribeFinePointer(onChange: () => void) {
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Curseur croix de repérage — comme sur une table de reproduction
 * d'archives. Deux files de repérage traversent l'écran, une croix
 * centrale suit le pointeur et se resserre en vermillon sur les
 * éléments interactifs.
 *
 * Réservé aux pointeurs fins, sans effet si le mouvement est réduit.
 * Les champs de saisie conservent leur curseur texte natif.
 */
export function CrosshairCursor() {
  const reduce = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
  const enabled = finePointer && !reduce;
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springX = useSpring(x, { stiffness: 620, damping: 42, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 620, damping: 42, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("has-crosshair");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target instanceof Element ? e.target : null;
      setActive(Boolean(target?.closest(INTERACTIVE)));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.body.classList.remove("has-crosshair");
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Files de repérage */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 z-[99] w-px bg-ink/[0.08]"
        style={{ left: springX }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-[99] h-px bg-ink/[0.08]"
        style={{ top: springY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Croix centrale */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[100]"
        style={{ left: springX, top: springY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="relative h-8 w-8 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: active ? 0.55 : 1,
            rotate: active ? 45 : 0,
          }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {/* Anneau */}
          <span
            className={`absolute inset-[9px] rounded-full border-[1.5px] transition-colors duration-200 ${
              active ? "border-accent bg-accent/15" : "border-ink/60"
            }`}
          />
          {/* Repères de visée */}
          <span
            className={`absolute left-1/2 top-[-3px] h-[7px] w-px -translate-x-1/2 transition-colors duration-200 ${
              active ? "bg-accent" : "bg-ink/60"
            }`}
          />
          <span
            className={`absolute bottom-[-3px] left-1/2 h-[7px] w-px -translate-x-1/2 transition-colors duration-200 ${
              active ? "bg-accent" : "bg-ink/60"
            }`}
          />
          <span
            className={`absolute left-[-3px] top-1/2 h-px w-[7px] -translate-y-1/2 transition-colors duration-200 ${
              active ? "bg-accent" : "bg-ink/60"
            }`}
          />
          <span
            className={`absolute right-[-3px] top-1/2 h-px w-[7px] -translate-y-1/2 transition-colors duration-200 ${
              active ? "bg-accent" : "bg-ink/60"
            }`}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
