"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { CloseIcon } from "@/components/ui/icons";
import { Cote } from "@/components/ui/Cote";

/**
 * « L'Archiviste » — widget de conversation publique (fiche DCB·2026·08).
 *
 * Un sceau vermillon discret en bas à droite ouvre la salle de lecture :
 * un bordereau coté où le visiteur pose ses questions et où l'Archiviste
 * répond, l'encre encore fraîche — le texte arrive en flux (SSE), sous
 * un curseur bloc qui clignote le temps de la consultation.
 *
 * Le montage est conditionné côté serveur (`isChatEnabled()` dans le
 * layout) : sans clé OpenRouter, ni bouton ni panneau dans la page. La
 * conversation vit dans l'état du composant — rien ne survit au
 * rafraîchissement, rien n'est versé au store. L'historique envoyé est
 * plafonné côté client (24 tours) comme côté serveur ; la question, à
 * 800 caractères.
 */

/** Salutation d'ouverture — versée par l'Archiviste à l'arrivée. */
const GREETING =
  "Bienvenue à la salle de lecture. L'Archiviste conserve le fonds de Daniel Chabi Bouko — parcours, compétences, projets, articles du blog. Que souhaitez-vous consulter ?";

/** Repli local, quand le flux lui-même ne répond plus. */
const REGISTRE_INDISPONIBLE =
  "Le registre est momentanément indisponible — repassez plus tard, ou écrivez via le formulaire de contact de la page d'accueil.";

/** Plafond de la question, côté saisie comme côté serveur (zod). */
const MAX_QUESTION = 800;
/** Tours de conversation envoyés — le serveur en refuse au-delà de 24. */
const MAX_SENT = 24;

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

/* ------------------------------------------------------------------ */
/*  Rendu du texte — markdown léger du modèle (gras, listes)           */
/* ------------------------------------------------------------------ */

/** Gras `**ainsi**` et italique `*ainsi*` → <strong>/<em> ; le reste tel quel. */
function inline(text: string) {
  const out: React.ReactNode[] = [];
  let key = 0;
  for (const chunk of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (chunk.startsWith("**") && chunk.endsWith("**") && chunk.length > 4) {
      out.push(
        <strong key={key++} className="font-semibold text-ink">
          {chunk.slice(2, -2)}
        </strong>,
      );
      continue;
    }
    for (const part of chunk.split(/(\*[^*]+\*)/g)) {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        out.push(<em key={key++}>{part.slice(1, -1)}</em>);
      } else if (part) {
        out.push(part);
      }
    }
  }
  return out;
}

/** Paragraphes et listes à puces — assez pour le « markdown léger » du prompt. */
function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="whitespace-pre-line">
        {inline(para.join("\n"))}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`u-${blocks.length}`} className="flex flex-col gap-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="mt-[0.45em] size-[5px] shrink-0 rotate-45 bg-accent/70" />
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of text.split("\n")) {
    const item = raw.match(/^\s*[-•]\s+(.*)$/);
    if (item) {
      flushPara();
      list.push(item[1]);
    } else if (raw.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(raw.trimEnd());
    }
  }
  flushPara();
  flushList();

  return <div className="flex flex-col gap-2">{blocks}</div>;
}

/* ------------------------------------------------------------------ */
/*  Curseur d'écriture                                                 */
/* ------------------------------------------------------------------ */

function InkCursor({ reduce }: { reduce: boolean }) {
  return (
    <span
      aria-hidden
      className={`ml-[0.15em] inline-block h-[0.95em] w-[0.5em] translate-y-[0.14em] bg-ink/75 ${
        reduce ? "" : "animate-pulse"
      }`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Le widget                                                          */
/* ------------------------------------------------------------------ */

export function ArchivistChat() {
  const reduce = useReducedMotion();
  const panelId = useId();
  const titleId = `${panelId}-titre`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const nextId = useRef(1);
  const activeId = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stick = useRef(true);

  /* Échap referme la salle de lecture ; le focus va à la saisie à l'ouverture. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
    };
  }, [open]);

  /* Suivi du défilement : la colonne suit l'encre, sauf si on la quitte. */
  useEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onBodyScroll() {
    const el = bodyRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  }

  /** Réécrit le message en cours (celui qui coule de l'encre). */
  function patchActive(patch: (content: string) => string) {
    const id = activeId.current;
    if (id === null) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: patch(m.content) } : m)),
    );
  }

  /** Une réponse de repli, dans le ton — jamais d'erreur technique. */
  function appendFallback(text: string) {
    patchActive((content) => (content ? `${content}\n\n${text}` : text));
  }

  /** Relance la consultation à zéro — bordereau vierge. */
  function reset() {
    abort.current?.abort();
    abort.current = null;
    activeId.current = null;
    setStreaming(false);
    setMessages([{ id: 0, role: "assistant", content: GREETING }]);
    setInput("");
    stick.current = true;
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function ask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    const history: Msg[] = [
      ...messages,
      { id: nextId.current++, role: "user", content: question },
    ];
    const replyId = nextId.current++;
    activeId.current = replyId;
    stick.current = true;
    setInput("");
    setMessages([...history, { id: replyId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abort.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-MAX_SENT).map(({ role, content }) => ({ role, content })),
          website: honeypot.current?.value ?? "",
        }),
        signal: controller.signal,
      });

      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("text/event-stream")) {
        /* Réponse JSON : refus poliment motivé (quota, validation, fermeture). */
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        appendFallback(json?.error ?? REGISTRE_INDISPONIBLE);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;
      let failure: string | null = null;

      stream: for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const data = JSON.parse(line.slice(5).trim()) as {
              delta?: string;
              error?: string;
            };
            if (typeof data.delta === "string" && data.delta) {
              received = true;
              const delta = data.delta;
              patchActive((content) => content + delta);
            } else if (data.error) {
              failure = data.error;
              break stream;
            }
          } catch {
            /* fragment d'évènement — le tampon attendra la suite */
          }
        }
      }

      if (failure) appendFallback(failure);
      else if (!received) appendFallback(REGISTRE_INDISPONIBLE);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      appendFallback(REGISTRE_INDISPONIBLE);
    } finally {
      /* Le tour est clos, même si le panneau a été refermé entre-temps. */
      if (abort.current === controller) {
        abort.current = null;
        activeId.current = null;
        setStreaming(false);
      }
    }
  }

  const statusLine = streaming
    ? "L'Archiviste consulte le registre…"
    : "Salle de lecture — le fonds est ouvert";

  return (
    <>
      {/* Le sceau — tampon vermillon, discret, jamais auto-ouvert */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer la salle de lecture" : "Consulter l'Archiviste"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        whileHover={reduce ? undefined : { scale: 1.06, rotate: -11 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-40 grid size-14 -rotate-[8deg] cursor-pointer place-items-center rounded-full border-[2.5px] border-accent/90 bg-surface shadow-card transition-colors duration-300 hover:border-accent hover:bg-bg"
      >
        <span aria-hidden className="pointer-events-none absolute inset-[3.5px] rounded-full border border-accent/55" />
        <span aria-hidden className="absolute left-[7px] top-1/2 size-[4.5px] -translate-y-1/2 rotate-45 bg-accent/80" />
        <span aria-hidden className="absolute right-[7px] top-1/2 size-[4.5px] -translate-y-1/2 rotate-45 bg-accent/80" />
        <span aria-hidden className="font-serif text-[22px] italic leading-none text-accent">
          A.
        </span>
      </motion.button>

      {/* La salle de lecture — bordereau coté, encastré au-dessus du sceau */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-labelledby={titleId}
            initial={reduce ? false : { opacity: 0, y: 28, scale: 0.95, rotate: -0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{
              opacity: 0,
              y: 16,
              scale: 0.97,
              transition: { duration: 0.18, ease: "easeOut" },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.9 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-[5.5rem] right-5 z-40 flex max-h-[min(70dvh,32rem)] w-[min(23.75rem,calc(100vw-2.5rem))] flex-col border border-ink/25 bg-surface shadow-[0_36px_90px_-28px_rgba(18,14,8,0.55)]"
          >
            {/* En-tête du bordereau */}
            <header className="border-b border-dashed border-ink/35 px-4 pb-3 pt-3.5">
              <Cote code="DCB·2026·08" label="Cote" tone="accent" />
              <div className="mt-1.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id={titleId} className="font-serif text-xl leading-tight text-ink">
                    L'Archiviste
                  </h2>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    <span
                      aria-hidden
                      className={`size-[5px] rotate-45 bg-accent ${
                        streaming && !reduce ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="truncate">{statusLine}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer la salle de lecture"
                  className="cursor-pointer border border-ink/25 p-1.5 text-ink-dim transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              </div>
            </header>

            {/* Le registre de la conversation */}
            <div
              ref={bodyRef}
              onScroll={onBodyScroll}
              role="log"
              aria-live="polite"
              aria-label="Conversation avec l'Archiviste"
              className="flex flex-col gap-4 overflow-y-auto px-4 py-4"
            >
              {messages.map((m) =>
                m.role === "user" ? (
                  <motion.div
                    key={m.id}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="ml-auto max-w-[85%] border border-ink/30 bg-bg px-3 py-2"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-faint">
                      Demande
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                      {m.content}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={m.id}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="max-w-[92%]"
                  >
                    <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
                      <span aria-hidden className="size-[5px] rotate-45 bg-accent" />
                      Réponse
                    </p>
                    <div className="mt-1 text-sm leading-relaxed text-ink-dim">
                      {m.content === "" && streaming && m.id === activeId.current ? (
                        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                          L'encre monte
                          <InkCursor reduce={Boolean(reduce)} />
                        </p>
                      ) : (
                        <RichText text={m.content} />
                      )}
                      {streaming && m.id === activeId.current && m.content !== "" && (
                        <InkCursor reduce={Boolean(reduce)} />
                      )}
                    </div>
                  </motion.div>
                ),
              )}
            </div>

            {/* Zone de versement */}
            <form onSubmit={ask} className="relative border-t border-dashed border-ink/35 p-3">
              {/* Honeypot — hors écran, invisible pour l'humain, appât au robot */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor={`${panelId}-website`}>Site web</label>
                <input
                  ref={honeypot}
                  id={`${panelId}-website`}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={MAX_QUESTION}
                  placeholder="Poser une question au fonds…"
                  aria-label="Votre demande à l'Archiviste"
                  className="min-w-0 flex-1 border border-ink/30 bg-bg px-3 py-2 font-mono text-[13px] text-ink transition-colors placeholder:text-ink-faint/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="shrink-0 cursor-pointer border border-accent/60 bg-accent/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep transition-colors hover:bg-accent hover:text-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Verser
                </button>
              </div>
              {input.length > MAX_QUESTION - 150 && (
                <p className="mt-1 text-right font-mono text-[10px] text-ink-faint">
                  {MAX_QUESTION - input.length}
                </p>
              )}
            </form>

            {/* Pied du bordereau */}
            <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-ink/25 px-4 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                Réponses établies sur le fonds
              </p>
              <div className="flex items-center gap-3">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
                  >
                    Nouvelle consultation
                  </button>
                )}
                <a
                  href="/#contact"
                  onClick={() => setOpen(false)}
                  className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
                >
                  Contact
                </a>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
