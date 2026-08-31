"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

type Tone = "accent" | "cyan" | "green" | "ink";

const TONE_STROKE: Record<Tone, string> = {
  accent: "var(--color-accent)",
  cyan: "var(--color-cyan)",
  green: "var(--color-green)",
  ink: "var(--color-ink)",
};

type StampProps = {
  /** Texte sur l'arc supérieur. */
  top?: string;
  /** Inscription centrale (serif italique). */
  center?: string;
  /** Petite ligne sous l'inscription centrale. */
  centerSub?: string;
  /** Texte sur l'arc inférieur. */
  bottom?: string;
  tone?: Tone;
  /** Taille en pixels (carré). */
  size?: number;
  /** Inclinaison résiduelle du tampon, en degrés. */
  tilt?: number;
  /** Décalage d'apparition en secondes. */
  delay?: number;
  className?: string;
};

/**
 * Tampon réglementaire en SVG : double cercle, texte incurvé, inscription
 * centrale — et une encre légèrement irrégulière (filtre de displacement).
 * Le tampon s'« imprime » à l'entrée dans le viewport : échelle, rotation
 * et flou d'impact, puis l'encre se fixe.
 */
export function Stamp({
  top,
  center,
  centerSub,
  bottom,
  tone = "accent",
  size = 130,
  tilt = -8,
  delay = 0,
  className = "",
}: StampProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `stamp-rough-${uid}`;

  const svg = (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={className}
    >
      {/* Encre irrégulière */}
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
        {/* Arc supérieur — gauche vers la droite par le haut */}
        <path
          id={`arc-top-${uid}`}
          d="M 15 60 A 45 45 0 0 1 105 60"
          fill="none"
        />
        {/* Arc inférieur — gauche vers la droite par le bas (texte lisible) */}
        <path
          id={`arc-bottom-${uid}`}
          d="M 18 60 A 42 42 0 0 0 102 60"
          fill="none"
        />
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* Double cercle extérieur */}
        <circle cx="60" cy="60" r="56" stroke={TONE_STROKE[tone]} strokeWidth="2.4" opacity="0.9" />
        <circle cx="60" cy="60" r="52.5" stroke={TONE_STROKE[tone]} strokeWidth="1" opacity="0.75" />
        {/* Cercle intérieur délimitant la zone centrale */}
        <circle cx="60" cy="60" r="34" stroke={TONE_STROKE[tone]} strokeWidth="1" opacity="0.75" />

        {/* Textes incurvés */}
        {top && (
          <text
            fill={TONE_STROKE[tone]}
            fontSize="8.6"
            fontFamily="var(--font-plex-mono), monospace"
            letterSpacing="1.6"
            opacity="0.95"
          >
            <textPath href={`#arc-top-${uid}`} startOffset="50%" textAnchor="middle">
              {top}
            </textPath>
          </text>
        )}
        {bottom && (
          <text
            fill={TONE_STROKE[tone]}
            fontSize="8.6"
            fontFamily="var(--font-plex-mono), monospace"
            letterSpacing="1.6"
            opacity="0.95"
          >
            <textPath href={`#arc-bottom-${uid}`} startOffset="50%" textAnchor="middle">
              {bottom}
            </textPath>
          </text>
        )}

        {/* Losanges séparateurs latéraux */}
        <rect x="11.4" y="57.6" width="4.8" height="4.8" transform="rotate(45 13.8 60)" fill={TONE_STROKE[tone]} opacity="0.85" />
        <rect x="103.8" y="57.6" width="4.8" height="4.8" transform="rotate(45 106.2 60)" fill={TONE_STROKE[tone]} opacity="0.85" />

        {/* Inscription centrale */}
        {center && (
          <text
            x="60"
            y={centerSub ? 62 : 66}
            textAnchor="middle"
            fill={TONE_STROKE[tone]}
            fontSize="19"
            fontStyle="italic"
            fontFamily="var(--font-fraunces), Georgia, serif"
          >
            {center}
          </text>
        )}
        {centerSub && (
          <text
            x="60"
            y="75"
            textAnchor="middle"
            fill={TONE_STROKE[tone]}
            fontSize="7.4"
            letterSpacing="2"
            fontFamily="var(--font-plex-mono), monospace"
          >
            {centerSub}
          </text>
        )}
      </g>
    </svg>
  );

  if (reduce) {
    return (
      <div style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }} className={className}>
        {svg}
      </div>
    );
  }

  return (
    <motion.div
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 1.7, rotate: tilt - 7, filter: "blur(3px)" }}
      whileInView={{ opacity: 1, scale: 1, rotate: tilt, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 1.4, 0.4, 1] }}
      className={className}
    >
      {svg}
    </motion.div>
  );
}
