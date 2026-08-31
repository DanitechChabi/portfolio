"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSkill, saveSkill } from "@/lib/admin-actions";
import type { Skill } from "@/types/content";
import { SkillNotches } from "@/components/home/SkillNotches";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import {
  AdminHeading,
  Card,
  ErrorBanner,
  Field,
  SubmitButton,
  TextInput,
  inputClass,
} from "./form-ui";

/**
 * Gestion des compétences (store Blob). Formulaire de création/édition
 * en tête, inventaire regroupé par pôle dessous — les carrés de niveau
 * sont les mêmes que sur le site public.
 */

/** Catégories connues — une par pôle d'encre. */
const CATEGORIES = [
  "Archivistique & GED",
  "Data & analyse",
  "Développement web",
] as const;

const LEVELS = [
  { value: 1, label: "1 — Notions" },
  { value: 2, label: "2 — Notions +" },
  { value: 3, label: "3 — Intermédiaire" },
  { value: 4, label: "4 — Avancé" },
  { value: 5, label: "5 — Expert" },
];

/** Encre du pôle correspondant à la catégorie (pour les carrés de niveau). */
function toneForCategory(category: string): "accent" | "cyan" | "green" {
  if (/archiv|ged/i.test(category)) return "accent";
  if (/data|analy/i.test(category)) return "cyan";
  if (/d[eé]v|web|code|program/i.test(category)) return "green";
  return "accent";
}

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0] as string,
  level: 4,
  sort_order: 0,
};

export function SkillsManager({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  /* Regroupement par catégorie — pôles connus d'abord, puis le reste. */
  const byCategory = new Map<string, Skill[]>();
  for (const skill of skills) {
    byCategory.set(skill.category, [...(byCategory.get(skill.category) ?? []), skill]);
  }
  const orderedCategories = [
    ...CATEGORIES.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !(CATEGORIES as readonly string[]).includes(c)),
  ];

  function startEdit(skill: Skill) {
    setEditingId(skill.id);
    setForm({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      sort_order: skill.sort_order,
    });
    setError(null);
    setSavedFlash(false);
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSavedFlash(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSavedFlash(false);

    try {
      const result = await saveSkill({
        ...(editingId !== null ? { id: editingId } : {}),
        name: form.name,
        category: form.category,
        level: form.level,
        sort_order: form.sort_order,
      });
      if (!result.ok) throw new Error(result.error);

      startNew();
      setSavedFlash(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(skill: Skill) {
    if (!window.confirm(`Supprimer « ${skill.name} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteSkill(skill.id);
      if (!result.ok) throw new Error(result.error);
      if (editingId === skill.id) startNew();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminHeading
        title="Compétences"
        description="L'inventaire des savoir-faire, trois pôles — une encre chacun."
      />

      <ErrorBanner message={error} />
      {savedFlash && (
        <p
          className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-soft"
          role="status"
        >
          Compétence enregistrée — le site public se met à jour dans un instant.
        </p>
      )}

      {/* Formulaire création / édition */}
      <Card className="mt-6 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-ink">
            {editingId !== null ? "Modifier la compétence" : "Nouvelle compétence"}
          </h2>
          {editingId !== null && (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Repartir de zéro
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="Nom"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="GED — Gestion Électronique des Documents"
            />
            <Field
              label="Catégorie (pôle)"
              hint="Les trois pôles du site ; une autre valeur part au registre « Divers »."
            >
              <input
                list="categories-competences"
                required
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}
              />
              <datalist id="categories-competences">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Niveau" hint="Carrés de niveau affichés sur le site public.">
              <select
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}
                className={inputClass}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
            <TextInput
              label="Ordre d'affichage"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
              }
              hint="Croissant au sein du pôle (10, 20, 30…)."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line-soft pt-5">
            <SubmitButton loading={busy}>
              {editingId !== null ? "Enregistrer" : "Ajouter la compétence"}
            </SubmitButton>
          </div>
        </form>
      </Card>

      {/* Inventaire */}
      <div className="mt-10 space-y-8">
        {orderedCategories.map((category) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">
                {category}
              </h3>
              <span className="h-px flex-1 bg-line-soft" aria-hidden />
              <span className="text-xs text-ink-faint">
                {byCategory.get(category)?.length}
              </span>
            </div>
            <Card>
              <ul>
                {(byCategory.get(category) ?? []).map((skill, i) => (
                  <li
                    key={skill.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${
                      i > 0 ? "border-t border-line-soft" : ""
                    } ${editingId === skill.id ? "bg-accent/[0.06]" : ""}`}
                  >
                    <span className="min-w-0 flex-1 text-sm text-ink">{skill.name}</span>
                    <SkillNotches level={skill.level} tone={toneForCategory(skill.category)} />
                    <button
                      type="button"
                      onClick={() => startEdit(skill)}
                      disabled={busy}
                      aria-label={`Modifier « ${skill.name} »`}
                      className="rounded-lg border border-line p-2 text-ink-dim transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(skill)}
                      disabled={busy}
                      aria-label={`Supprimer « ${skill.name} »`}
                      className="rounded-lg border border-line p-2 text-ink-dim transition-colors hover:border-red-800/50 hover:text-red-800 disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}

        {skills.length === 0 && (
          <Card className="p-10 text-center text-sm text-ink-dim">
            Aucune compétence pour le moment — ajoutez la première ci-dessus.
          </Card>
        )}
      </div>
    </div>
  );
}
