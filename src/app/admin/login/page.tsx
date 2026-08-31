"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/admin-actions";

/**
 * Connexion admin par identifiant + mot de passe (variables
 * d'environnement ADMIN_USERNAME / ADMIN_PASSWORD). La session est un
 * cookie signé posé par la server action.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await loginAction(username, password);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? `Connexion impossible : ${e.message}` : "Connexion impossible.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface/70 p-8 shadow-card md:p-10">
          {/* Marque */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-bg/60 font-serif text-xl leading-none text-ink">
              D<span className="text-accent">.</span>
            </span>
            <div>
              <p className="font-serif text-lg tracking-tight text-ink">
                Administration
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                Portfolio — Daniel Chabi Bouko
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm leading-relaxed text-ink-dim">
            Espace réservé au propriétaire du site : profil, articles,
            parcours, compétences et messages. Les projets, eux, se
            synchronisent automatiquement depuis GitHub.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <p
                className="rounded-xl border border-red-800/40 bg-red-900/5 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            )}

            <div>
              <label
                htmlFor="admin-username"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-ink-faint"
              >
                Identifiant
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg/70 px-4 py-2.5 text-sm text-ink transition-colors focus:border-accent/60 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-ink-faint"
              >
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg/70 px-4 py-2.5 text-sm text-ink transition-colors focus:border-accent/60 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-deep/30 border-t-bg-deep" />
              )}
              {loading ? "Vérification…" : "Se connecter"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-full px-6 py-3 text-sm text-ink-faint transition-colors hover:text-ink"
          >
            ← Retour au site
          </button>
        </div>
      </div>
    </div>
  );
}
