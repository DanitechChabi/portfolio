"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePost, savePost } from "@/lib/admin-actions";
import type { Post } from "@/types/content";
import { slugify } from "@/lib/format";
import { Markdown } from "@/components/blog/Markdown";
import { ImageUploader } from "./ImageUploader";
import {
  AdminHeading,
  DangerButton,
  ErrorBanner,
  Field,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
  inputClass,
} from "./form-ui";

type PostFormProps = {
  /** Article existant à modifier ; absent = création. */
  post?: Post;
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [publishedAt, setPublishedAt] = useState(
    toLocalInputValue(post?.published_at ?? null),
  );

  const [tab, setTab] = useState<"ecrire" | "apercu">("ecrire");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!title.trim() || !effectiveSlug.trim() || !content.trim()) {
      setError("Le titre, le slug et le contenu sont obligatoires.");
      return;
    }

    setSaving(true);
    setError(null);

    const publishedAtIso = publishedAt
      ? new Date(publishedAt).toISOString()
      : published
        ? new Date().toISOString()
        : null;

    try {
      const result = await savePost({
        ...(post ? { id: post.id } : {}),
        title: title.trim(),
        slug: effectiveSlug.trim(),
        excerpt: excerpt.trim(),
        content: content,
        cover_image_url: coverUrl.trim(),
        published,
        published_at: publishedAtIso,
      });
      if (!result.ok) throw new Error(result.error);

      router.push("/admin/posts");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? `Enregistrement impossible : ${e.message}`
          : "Enregistrement impossible.",
      );
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || deleting) return;
    if (!window.confirm(`Supprimer définitivement « ${post.title} » ?`)) return;

    setDeleting(true);
    setError(null);
    try {
      const result = await deletePost(post.id);
      if (!result.ok) throw new Error(result.error);
      router.push("/admin/posts");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? `Suppression impossible : ${e.message}` : "Suppression impossible.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminHeading
        title={isEdit ? `Modifier — ${post!.title}` : "Nouvel article"}
        description="Le contenu est rédigé en Markdown (titres, listes, gras, liens…)."
        actions={
          isEdit && (
            <DangerButton type="button" onClick={handleDelete} loading={deleting}>
              Supprimer
            </DangerButton>
          )
        }
      />

      <ErrorBanner message={error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Titre"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="L'archiviste 2.0…"
        />
        <TextInput
          label="Slug (URL)"
          required
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          hint={`/blog/${effectiveSlug || "…"}`}
        />
      </div>

      <TextArea
        label="Accroche"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
        hint="Résumé affiché dans la liste des articles."
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
            Contenu <span className="ml-1 text-accent">*</span>
          </p>
          <div className="flex rounded-full border border-line p-0.5">
            {(
              [
                ["ecrire", "Écrire"],
                ["apercu", "Aperçu"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-1 text-xs transition-colors ${
                  tab === value
                    ? "bg-accent/15 text-accent-soft"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "ecrire" ? (
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder={"## Un sous-titre\n\nLe texte de l'article…"}
            className="w-full rounded-xl border border-line bg-bg/70 px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-faint/60 transition-colors focus:border-accent/60 focus:outline-none"
          />
        ) : (
          <div className="min-h-64 rounded-xl border border-line bg-bg/50 p-6">
            {content.trim() ? (
              <Markdown content={content} />
            ) : (
              <p className="text-sm text-ink-faint">
                Rien à prévisualiser pour l&apos;instant.
              </p>
            )}
          </div>
        )}
      </div>

      <ImageUploader
        label="Image de couverture"
        folder="blog"
        value={coverUrl}
        onChange={setCoverUrl}
        hint="Optionnelle — une composition typographique élégante s'affiche sans image."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Toggle
          label="Publié"
          description="Visible sur le blog public."
          checked={published}
          onChange={setPublished}
        />
        <Field
          label="Date de publication"
          hint="Si vide et publié, la date du jour est utilisée."
        >
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line-soft pt-6">
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-full px-5 py-2.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          Annuler
        </button>
        <SubmitButton loading={saving}>
          {isEdit ? "Enregistrer les modifications" : "Créer l'article"}
        </SubmitButton>
      </div>
    </form>
  );
}
