"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProfile } from "@/lib/admin-actions";
import type { Profile } from "@/types/content";
import { ImageUploader } from "./ImageUploader";
import {
  AdminHeading,
  ErrorBanner,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from "./form-ui";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: profile.name,
    title: profile.title,
    tagline: profile.tagline,
    bio: profile.bio,
    location: profile.location,
    current_role: profile.current_role,
    email: profile.email,
    linkedin_url: profile.linkedin_url,
    github_url: profile.github_url,
    avatar_url: profile.avatar_url,
  });
  const [showAvatar, setShowAvatar] = useState(Boolean(profile.avatar_url));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const result = await saveProfile(form);
      if (!result.ok) throw new Error(result.error);

      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? `Enregistrement impossible : ${e.message}`
          : "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminHeading
        title="Profil"
        description="Ces informations alimentent le hero, la section « À propos », le pied de page et les métadonnées du site."
      />

      <ErrorBanner message={error} />
      {saved && (
        <p
          className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-soft"
          role="status"
        >
          Profil enregistré — le site public se met à jour dans un instant.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Nom complet"
          required
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
        />
        <TextInput
          label="Titre"
          required
          value={form.title}
          onChange={(e) => set("title")(e.target.value)}
          hint="Séparez les rôles par « · » (ex. Archiviste 2.0 · Développeur web)."
        />
      </div>

      <TextInput
        label="Accroche"
        value={form.tagline}
        onChange={(e) => set("tagline")(e.target.value)}
        hint="La phrase sous votre nom, dans le hero."
      />

      <TextArea
        label="Bio"
        value={form.bio}
        onChange={(e) => set("bio")(e.target.value)}
        rows={5}
        hint="Paragraphes séparés par une ligne vide."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Localisation"
          value={form.location}
          onChange={(e) => set("location")(e.target.value)}
          placeholder="Cotonou, Bénin"
        />
        <TextInput
          label="Poste actuel"
          value={form.current_role}
          onChange={(e) => set("current_role")(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="LinkedIn (URL)"
          type="url"
          value={form.linkedin_url}
          onChange={(e) => set("linkedin_url")(e.target.value)}
        />
        <TextInput
          label="GitHub (URL)"
          type="url"
          value={form.github_url}
          onChange={(e) => set("github_url")(e.target.value)}
        />
      </div>

      <TextInput
        label="Email (public)"
        type="email"
        value={form.email}
        onChange={(e) => set("email")(e.target.value)}
        hint="Laisser vide pour ne pas l'afficher."
      />

      <Toggle
        label="Afficher un portrait"
        description="Sinon, une fiche d'archive typographique élégante s'affiche."
        checked={showAvatar}
        onChange={(v) => {
          setShowAvatar(v);
          if (!v) set("avatar_url")("");
        }}
      />

      {showAvatar && (
        <ImageUploader
          label="Portrait"
          folder="avatars"
          value={form.avatar_url}
          onChange={(url) => set("avatar_url")(url)}
          hint="Format portrait recommandé (ex. 640×800)."
        />
      )}

      <div className="flex items-center justify-end gap-3 border-t border-line-soft pt-6">
        <SubmitButton loading={saving}>Enregistrer le profil</SubmitButton>
      </div>
    </form>
  );
}
