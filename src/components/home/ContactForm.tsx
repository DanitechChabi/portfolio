"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { CheckIcon } from "@/components/ui/icons";

type Status = "idle" | "sending" | "success" | "error";

/* text-base (16px) obligatoire : sous cette taille, iOS Safari zoome
   toute la page au focus du champ. */
const FIELD =
  "w-full border border-ink/30 bg-bg px-4 py-3 text-base text-ink placeholder:text-ink-faint/70 transition-colors focus:border-accent focus:outline-none";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "L'envoi a échoué. Réessayez plus tard.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "L'envoi a échoué. Réessayez plus tard.",
      );
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex h-full min-h-[24rem] flex-col items-center justify-center border border-accent/40 bg-surface p-10 text-center shadow-card"
        role="status"
      >
        <span className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-accent">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="wonk mt-6 font-serif text-2xl text-ink">Message versé au fonds</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-dim">
          Merci pour votre message — je vous réponds dès que possible, généralement
          sous 48&nbsp;heures.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 border border-ink/40 px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent-deep"
        >
          Écrire un autre message
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ink/25 bg-surface p-7 shadow-card md:p-8"
      noValidate={false}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint"
          >
            Nom
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Votre nom"
            className={FIELD}
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="vous@exemple.com"
            className={FIELD}
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="contact-message"
          className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          placeholder="Parlez-moi de votre projet, d'un besoin en GED, d'une idée de collaboration…"
          className={`${FIELD} resize-y leading-relaxed`}
        />
      </div>

      {/* Honeypot — invisible pour les humains */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Site web</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <AnimatePresence>
        {status === "error" && error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-accent-deep"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="hidden font-mono text-[11px] text-ink-faint sm:block">
          Réponse sous 48&nbsp;heures.
        </p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2.5 border border-accent bg-accent px-7 py-3 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-deep hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-deep/30 border-t-bg-deep" />
          )}
          {status === "sending" ? "Envoi…" : "Verser au fonds"}
        </button>
      </div>
    </form>
  );
}
