"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ChartSpec } from "@/content/projects.config";
import { EASE } from "@/lib/motion";
import { CHART_SURFACE } from "@/lib/chart-palette";

/**
 * Mini-graphique d'un projet (page détail) — série unique en cyanotype.
 * Colonnes ou ligne selon la spec, infobulle au survol, animation de
 * tracé respectant prefers-reduced-motion, et vue tableau repliée pour
 * l'accès complet aux données.
 */

const HUE = "#11558c"; // cyanotype validé — la série (data), cf. chart-palette

const W = 720;
const H = 320;
const M = { top: 30, right: 16, bottom: 36, left: 56 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const GRID = "#e9e1cd"; // filet à un cran de la surface
const AXIS = "#c9bfa2";

const fmt = new Intl.NumberFormat("fr-FR");

/** Échelle « propre » : pas dans {1, 2, 2.5, 5} × 10^k, 2 à 5 niveaux. */
function niceScale(max: number): { max: number; step: number } {
  if (max <= 0) return { max: 1, step: 0.25 };
  const rawStep = max / 4;
  const base = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((c) => c * base).find((s) => s >= rawStep) ?? 10 * base;
  return { max: Math.ceil(max / step) * step, step };
}

/** Rectangle à coins arrondis côté données (haut), carré à la base. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return [
    `M ${x} ${y + h}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `H ${x + w - r}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `V ${y + h}`,
    "Z",
  ].join(" ");
}

export function ProjectChart({ spec }: { spec: ChartSpec }) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();

  const points = spec.points;
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const { max: scaleMax, step } = niceScale(max);

  const yFor = (v: number) => M.top + PLOT_H - (v / scaleMax) * PLOT_H;
  const band = PLOT_W / points.length;
  const xFor = (i: number) => M.left + band * i + band / 2;

  const ticks: number[] = [];
  for (let v = 0; v <= scaleMax + 1e-9; v += step) ticks.push(v);

  const maxIndex = values.indexOf(max);
  const lastIndex = points.length - 1;

  const ariaLabel =
    `${spec.title}. ${points.length} points, unité : ${spec.unit}. ` +
    `${points[0].label} : ${fmt.format(points[0].value)} ; ` +
    `${points[lastIndex].label} : ${fmt.format(points[lastIndex].value)} ; ` +
    `maximum ${points[maxIndex].label} : ${fmt.format(max)}.`;

  /* Ligne : miroir du point le plus proche sous le curseur. */
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (spec.kind !== "line" || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    const t = (vx - M.left - band / 2) / (PLOT_W - band);
    const idx = Math.round(t * lastIndex);
    setActive(Math.max(0, Math.min(lastIndex, idx)));
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");

  /* Position horizontale de l'infobulle, bornée pour ne pas déborder. */
  const tooltipLeft = (i: number) =>
    Math.min(90, Math.max(10, (xFor(i) / W) * 100));

  return (
    <figure className="w-full">
      {/* En-tête : titre + unité (série unique : pas d'encadré de légende) */}
      <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg text-ink">{spec.title}</h3>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          unité : {spec.unit}
        </p>
      </figcaption>

      <div
        className="relative mt-5 overflow-x-auto border border-ink/20 bg-surface p-4"
        onPointerLeave={() => setActive(null)}
      >
        <div className="relative min-w-[520px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={ariaLabel}
          className="h-auto w-full"
          onPointerMove={onPointerMove}
        >
          {/* Grille + graduations y */}
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke={v === 0 ? AXIS : GRID}
                strokeWidth={v === 0 ? 1.5 : 1}
              />
              <text
                x={M.left - 10}
                y={yFor(v) + 4}
                textAnchor="end"
                fontSize={12}
                fill="#877d63"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {fmt.format(v)}
              </text>
            </g>
          ))}

          {/* Graduations x */}
          {points.map((p, i) => (
            <text
              key={p.label}
              x={xFor(i)}
              y={M.top + PLOT_H + 24}
              textAnchor="middle"
              fontSize={12}
              fill="#877d63"
              fontFamily="var(--font-plex-mono), monospace"
            >
              {p.label}
            </text>
          ))}

          {spec.kind === "columns" && (
            <>
              {points.map((p, i) => {
                const w = Math.min(24, band * 0.55);
                const x = xFor(i) - w / 2;
                const y = yFor(p.value);
                const h = M.top + PLOT_H - y;
                return (
                  <motion.path
                    key={p.label}
                    d={columnPath(x, y, w, h)}
                    fill={HUE}
                    initial={reduce ? false : { scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "bottom",
                      opacity: active === null || active === i ? 1 : 0.55,
                    }}
                    className="transition-opacity duration-150"
                  />
                );
              })}
              {/* Étiquette directe — l'extrême uniquement */}
              <text
                x={xFor(maxIndex)}
                y={yFor(max) - 10}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="#201b12"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {fmt.format(max)}
              </text>
              {/* Aires de survol — toute la hauteur de la colonne */}
              {points.map((p, i) => (
                <rect
                  key={`hit-${p.label}`}
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseEnter={() => setActive(i)}
                />
              ))}
            </>
          )}

          {spec.kind === "line" && (
            <>
              <motion.path
                d={linePath}
                fill="none"
                stroke={HUE}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
              {points.map((p, i) => (
                <circle
                  key={p.label}
                  cx={xFor(i)}
                  cy={yFor(p.value)}
                  r={active === i ? 5 : 4}
                  fill={HUE}
                  stroke={CHART_SURFACE}
                  strokeWidth={2}
                />
              ))}
              {/* Croix de visée */}
              {active !== null && (
                <line
                  x1={xFor(active)}
                  x2={xFor(active)}
                  y1={M.top}
                  y2={M.top + PLOT_H}
                  stroke={AXIS}
                  strokeWidth={1}
                />
              )}
              {/* Étiquette directe — le point final uniquement */}
              <text
                x={xFor(lastIndex) - 10}
                y={yFor(points[lastIndex].value) - 12}
                textAnchor="end"
                fontSize={13}
                fontWeight={600}
                fill="#201b12"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {fmt.format(points[lastIndex].value)}
              </text>
            </>
          )}
        </svg>

        {/* Infobulle */}
        {active !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap border border-onink/20 bg-bg-deep px-2.5 py-1.5 text-center"
            style={{
              left: `${tooltipLeft(active)}%`,
              top: `${(yFor(points[active].value) / H) * 100}%`,
            }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-onink-dim">
              {points[active].label}
            </p>
            <p className="text-xs font-medium text-onink">
              {fmt.format(points[active].value)}{" "}
              <span className="font-normal text-onink-faint">{spec.unit}</span>
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Vue tableau — accès complet aux données */}
      <details className="mt-4">
        <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink">
          ▸ Voir les données
        </summary>
        <table className="mt-3 w-full max-w-md border-collapse text-sm">
          <caption className="sr-only">{spec.title}</caption>
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="py-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                {spec.kind === "columns" ? "Période" : "Point"}
              </th>
              <th scope="col" className="py-2 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                {spec.unit}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.label} className="border-b border-line-soft">
                <th scope="row" className="py-2 text-left font-normal text-ink">
                  {p.label}
                </th>
                <td className="nums py-2 text-right tabular-nums text-ink">
                  {fmt.format(p.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
