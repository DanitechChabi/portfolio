"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/admin-actions";
import { inputClass } from "./form-ui";
import { UploadIcon } from "@/components/ui/icons";

type ImageUploaderProps = {
  /** URL actuelle (vide = aucune image). */
  value: string;
  onChange: (url: string) => void;
  /** Dossier de destination dans le bucket « media ». */
  folder: string;
  label?: string;
  hint?: string;
};

const MAX_SIZE_MB = 5;

/**
 * Téléversement d'image vers Vercel Blob (dossier public « media/ »),
 * avec aperçu, saisie d'URL manuelle et suppression.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = "Image",
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Ce fichier n'est pas une image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image trop lourde (max ${MAX_SIZE_MB} Mo).`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(folder, file);
      if (!result.ok) throw new Error(result.error);
      onChange(result.url);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Échec du téléversement : ${e.message}`
          : "Échec du téléversement.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-bg/50 p-4">
        {/* Aperçu */}
        {value ? (
          <div className="relative overflow-hidden rounded-lg border border-line-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Aperçu de l'image"
              className="h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 rounded-full border border-line bg-bg/80 px-3 py-1 text-xs text-ink backdrop-blur-sm transition-colors hover:border-red-800/50 hover:text-red-800"
            >
              Retirer
            </button>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-faint">
            Aucune image pour le moment
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft disabled:opacity-60"
          >
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
            ) : (
              <UploadIcon className="h-4 w-4" />
            )}
            {uploading ? "Téléversement…" : "Téléverser un fichier"}
          </button>
          <span className="text-xs text-ink-faint">ou</span>
          <input
            type="url"
            value={value}
            placeholder="https://… (coller une URL)"
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} flex-1 min-w-40`}
          />
        </div>

        {error && <p className="text-xs text-red-800">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
    </div>
  );
}
