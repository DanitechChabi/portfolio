"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteExperience, saveExperience } from "@/lib/admin-actions";
import type { Experience, Hat } from "@/types/content";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import {
  AdminHeading,
  Card,
  ErrorBanner,
  Field,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
  inputClass,
} from "./form-ui";

/**
 * Gestion du parcours professionnel (store Blob). Chaque poste est une
 * pièce du registre : cote, période, casquettes portées — le même
 * vocabulaire que la section publique « Parcours ».
 */

const TYPES: Experience["type"][] = [
  "Temps plein",
  "Temps partiel",
  "Stage",
  "Formation",
];

const HAT_OPTIONS: { value: Hat; label: string; on: string }[] = [
  {
    value: "archives",
    label: "Archives",
    on: "border-accent bg-accent/10 text-accent-deep",
  },
  { value: "data", label: "Data", on: "border-cyan bg-cyan/10 text-cyan" },
  { value: "dev", label: "Dev", on: "border-green bg-green/10 text-green" },
];

const HAT_DOT: Record<Hat, string> = {
  archives: "bg-accent",
  data: "bg-cyan",
  dev: "bg-green",
};

type FormState = {
  cote: string;
  role: string;
  org: string;
  type: Experience["type"];
  period: string;
  start: string;
  current: boolean;
  location: string;
  summary: string;
  highlights: string;
  hats: Hat[];
};

const EMPTY_FORM: FormState = {
  cote: "",
  role: "",
  org: "",
  type: "Temps plein",
  period: "",
  start: "",
  current: false,
  location: "Cotonou, Bénin",
  summary: "",
  highlights: "",
  hats: ["archives"],
};

function formFromExperience(exp: Experience): FormState {
  return {
    cote: exp.cote,
    role: exp.role,
    org: exp.org,
    type: exp.type,
    period: exp.period,
    start: exp.start,
    current: Boolean(exp.current),
    location: exp.location,
    summary: exp.summary ?? "",
    highlights: (exp.highlights ?? []).join("\n"),
    hats: exp.hats,
  };
}

export function ExperiencesManager({ experiences }: { experiences: Experience[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  function startEdit(exp: Experience) {
    setEditingId(exp.id);
    setForm(formFromExperience(exp));
    setError(null);
    setSavedFlash(false);
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSavedFlash(false);
  }

  function toggleHat(hat: Hat) {
    setForm((f) => ({
      ...f,
      hats: f.hats.includes(hat) ? f.hats.filter((h) => h !== hat) : [...f.hats, hat],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!/^\d{4}-\d{2}$/.test(form.start)) {
      setError("Renseignez le mois de début (format AAAA-MM, ex. 2026-05).");
      return;
    }
    if (form.hats.length === 0) {
      setError("Cochez au moins une casquette (Archives, Data ou Dev).");
      return;
    }

    setBusy(true);
    setError(null);
    setSavedFlash(false);

    try {
      const result = await saveExperience({
        ...(editingId !== null ? { id: editingId } : {}),
        cote: form.cote,
        role: form.role,
        org: form.org,
        type: form.type,
        period: form.period,
        start: form.start,
        current: form.current,
        location: form.location,
        summary: form.summary,
        highlights: form.highlights.split("\n").map((l) => l.trim()).filter(Boolean),
        hats: form.hats,
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

  async function handleDelete(exp: Experience) {
    if (!window.confirm(`Supprimer « ${exp.role} — ${exp.org} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteExperience(exp.id);
      if (!result.ok) throw new Error(result.error);
      if (editingId === exp.id) startNew();
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
        title="Parcours"
        description="Les pièces du registre professionnel — postes, stages et missions, cote par cote."
      />

      <ErrorBanner message={error} />
      {savedFlash && (
        <p
          className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-soft"
          role="status"
        >
          Expérience enregistrée — le registre public se met à jour dans un instant.
        </p>
      )}

      {/* Formulaire création / édition */}
      <Card className="mt-6 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-ink">
            {editingId !== null ? "Modifier l'expérience" : "Nouvelle expérience"}
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
              label="Intitulé du poste"
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Archiviste & gestionnaire de données"
            />
            <TextInput
              label="Structure"
              required
              value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
              placeholder="AFGC — Bénin"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Type de contrat"
              hint="Comme affiché sur le site public."
            >
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as Experience["type"] }))
                }
                className={inputClass}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <TextInput
              label="Période (affichée)"
              required
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              placeholder="Mai 2026 — aujourd'hui"
            />
            <TextInput
              label="Début (triable)"
              type="month"
              required
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
              hint="Format AAAA-MM — sert au tri du registre."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="Cote"
              value={form.cote}
              onChange={(e) => setForm((f) => ({ ...f, cote: e.target.value }))}
              placeholder="EXP·2026·02"
              hint="Laisser vide pour une cote générée (EXP·année·numéro)."
            />
            <TextInput
              label="Lieu"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Cotonou, Bénin"
            />
          </div>

          <Toggle
            checked={form.current}
            onChange={(value) => setForm((f) => ({ ...f, current: value }))}
            label="Poste actuel"
            description="Affiché comme « en poste » sur le site public."
          />

          <Field
            label="Casquettes portées"
            hint="Au moins une — l'encre de chaque casquette colore la ligne du registre."
          >
            <div className="flex flex-wrap gap-2.5">
              {HAT_OPTIONS.map((hat) => {
                const active = form.hats.includes(hat.value);
                return (
                  <button
                    key={hat.value}
                    type="button"
                    onClick={() => toggleHat(hat.value)}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-200 ${
                      active
                        ? hat.on
                        : "border-line text-ink-faint hover:border-ink/40 hover:text-ink-dim"
                    }`}
                  >
                    {hat.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <TextArea
            label="Résumé"
            rows={2}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            placeholder="Une phrase — la mission principale du poste."
          />

          <TextArea
            label="Réalisations"
            rows={4}
            value={form.highlights}
            onChange={(e) => setForm((f) => ({ ...f, highlights: e.target.value }))}
            placeholder={"Instrument de recherche de 1 200 notices\nTableau de bord de suivi des flux"}
            hint="Une réalisation par ligne."
          />

          <div className="flex items-center justify-end gap-3 border-t border-line-soft pt-5">
            <SubmitButton loading={busy}>
              {editingId !== null ? "Enregistrer" : "Ajouter au registre"}
            </SubmitButton>
          </div>
        </form>
      </Card>

      {/* Registre */}
      <div className="mt-10 space-y-3">
        {experiences.map((exp) => (
          <Card
            key={exp.id}
            className={`flex flex-wrap items-center gap-x-4 gap-y-2.5 px-5 py-4 ${
              editingId === exp.id ? "border-accent/50 bg-accent/[0.05]" : ""
            }`}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {exp.cote}
            </span>
            <button
              type="button"
              onClick={() => startEdit(exp)}
              disabled={busy}
              className="min-w-0 flex-1 text-left"
              aria-label={`Modifier « ${exp.role} — ${exp.org} »`}
            >
              <p className="truncate text-sm text-ink">
                <span className="font-medium">{exp.role}</span>
                <span className="text-ink-dim"> — {exp.org}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {exp.period} · {exp.type} · {exp.location}
              </p>
            </button>
            <span className="flex items-center gap-1.5" aria-label="Casquettes">
              {exp.hats.map((hat) => (
                <span
                  key={hat}
                  title={hat}
                  className={`h-2.5 w-2.5 rotate-45 ${HAT_DOT[hat]}`}
                  aria-hidden
                />
              ))}
            </span>
            <button
              type="button"
              onClick={() => startEdit(exp)}
              disabled={busy}
              aria-label={`Modifier « ${exp.role} — ${exp.org} »`}
              className="rounded-lg border border-line p-2 text-ink-dim transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              <EditIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(exp)}
              disabled={busy}
              aria-label={`Supprimer « ${exp.role} — ${exp.org} »`}
              className="rounded-lg border border-line p-2 text-ink-dim transition-colors hover:border-red-800/50 hover:text-red-800 disabled:opacity-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </Card>
        ))}

        {experiences.length === 0 && (
          <Card className="p-10 text-center text-sm text-ink-dim">
            Aucune expérience pour le moment — ouvrez la première pièce ci-dessus.
          </Card>
        )}
      </div>
    </div>
  );
}
