import type { Hat } from "@/content/projects.config";

/** Métadonnées des trois casquettes — mêmes encres que le reste du site. */
export const HAT_META: Record<Hat, { label: string; chip: string; text: string }> = {
  archives: {
    label: "Archives",
    chip: "border-accent/40 bg-accent/[0.06] text-accent-deep",
    text: "text-accent",
  },
  data: {
    label: "Data",
    chip: "border-cyan/40 bg-cyan/[0.06] text-cyan",
    text: "text-cyan",
  },
  dev: {
    label: "Dév.",
    chip: "border-green/40 bg-green/[0.06] text-green",
    text: "text-green",
  },
};

/** Puces de casquettes d'un projet — l'encre porte le pôle. */
export function HatBadges({ hats, className = "" }: { hats: Hat[]; className?: string }) {
  if (hats.length === 0) return null;
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {hats.map((hat) => (
        <span
          key={hat}
          className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${HAT_META[hat].chip}`}
        >
          {HAT_META[hat].label}
        </span>
      ))}
    </span>
  );
}
