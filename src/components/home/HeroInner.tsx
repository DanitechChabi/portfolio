"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Profile } from "@/types/content";
import { EASE } from "@/lib/motion";
import { Cote } from "@/components/ui/Cote";
import { Stamp } from "@/components/ui/Stamp";

/**
 * Les trois casquettes, présentées comme trois lignes d'inventaire :
 * chaque métier a son encre, et les points de conduite les relient —
 * une seule et même personne, un seul et même objet : l'information.
 */
const HATS = [
  {
    key: "archives",
    label: "Archiviste 2.0",
    verb: "je structure la mémoire",
    text: "text-accent-deep",
    fill: "bg-accent",
  },
  {
    key: "data",
    label: "Data Analyst",
    verb: "je la fais parler",
    text: "text-cyan",
    fill: "bg-cyan",
  },
  {
    key: "dev",
    label: "Développeur web",
    verb: "je construis les outils",
    text: "text-green",
    fill: "bg-green",
  },
] as const;

export function HeroInner({ profile }: { profile: Profile }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };
  const item = reduce
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 26 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease: EASE },
        },
      };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-svh items-center overflow-hidden pb-24 pt-28 md:pt-32"
    >
      {/* Marge vermillon — la ligne rouge du cahier de registre */}
      <span
        className="absolute bottom-0 left-[6%] top-0 hidden w-px bg-accent/25 lg:block"
        aria-hidden
      />

      {/* Papier réglé, estompé vers le bas */}
      <div
        className="absolute inset-0 bg-ruled opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden
      />

      {/* Filigrane — dérive plus lentement que la page */}
      {!reduce && (
        <motion.span
          style={{ y: watermarkY }}
          className="watermark absolute -right-8 bottom-2 select-none font-serif text-[23vw] italic leading-none"
          aria-hidden
        >
          Reg.
        </motion.span>
      )}

      {/* Tampon d'ouverture du fonds */}
      <Stamp
        top="FONDS PERSONNEL"
        center="2.0"
        centerSub="ARCHIVISTE · DATA · DEV"
        bottom="COTONOU — BÉNIN"
        tilt={-9}
        size={150}
        delay={0.85}
        className="absolute right-8 top-28 hidden md:block lg:right-16 lg:top-32"
      />

      {/* Contenu */}
      <motion.div
        className="container-site relative z-10"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div style={reduce ? undefined : { y: contentY }} className="max-w-4xl">
          <motion.div variants={item}>
            <Cote code="DCB·2026·01" label="Cote d'ouverture" />
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
              <span className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-accent" aria-hidden />
                {profile.name}
              </span>
              <span className="text-ink-faint">{profile.location}</span>
            </p>
          </motion.div>

          <motion.h1
            variants={item}
            className="wonk mt-8 max-w-3xl text-[2.7rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
          >
            L&rsquo;information,
            <br />
            du <em className="italic text-accent">rayonnage</em> à{" "}
            <em className="italic text-cyan">l&rsquo;écran</em>.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-ink-dim md:text-lg"
          >
            {profile.tagline}
          </motion.p>

          {/* Les trois casquettes — lignes d'inventaire */}
          <motion.div variants={item} className="mt-12 max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
              Le même fonds, trois lectures
            </p>
            <ul className="mt-4 space-y-1">
              {HATS.map((hat) => (
                <li
                  key={hat.key}
                  className="group flex flex-wrap items-baseline gap-x-4 rounded-sm px-2 py-2.5 transition-colors duration-300 hover:bg-ink/[0.04] sm:flex-nowrap"
                >
                  <span
                    className={`h-2 w-2 shrink-0 translate-y-[-0.1em] rotate-45 ${hat.fill} transition-transform duration-300 group-hover:scale-125`}
                    aria-hidden
                  />
                  <span className="w-52 shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-ink">
                    {hat.label}
                  </span>
                  <span className="leader" aria-hidden />
                  <span className={`font-serif text-lg italic ${hat.text}`}>{hat.verb}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={item} className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href="#projets"
              className="inline-flex items-center gap-2 border border-accent bg-accent px-6 py-3 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-deep hover:text-surface active:scale-[0.98]"
            >
              Ouvrir le registre
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 border border-ink/40 bg-transparent px-6 py-3 text-sm font-medium text-ink transition-all duration-300 hover:border-accent hover:text-accent-deep active:scale-[0.98]"
            >
              Me contacter
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Indicateur de scroll */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 md:block"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            Feuilleter
          </span>
          <span className="relative h-12 w-px overflow-hidden bg-line">
            <motion.span
              className="absolute left-0 top-0 h-5 w-px bg-accent"
              animate={reduce ? undefined : { y: [-20, 48] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}
