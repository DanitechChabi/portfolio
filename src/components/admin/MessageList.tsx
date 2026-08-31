"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeMessage, setMessageRead } from "@/lib/admin-actions";
import type { Message } from "@/types/content";
import { formatDate } from "@/lib/format";
import { EyeIcon, TrashIcon } from "@/components/ui/icons";
import { AdminHeading, Card, ErrorBanner } from "./form-ui";

export function MessageList({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleRead(message: Message) {
    setBusyId(message.id);
    setError(null);
    try {
      const result = await setMessageRead(message.id, !message.read);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? `Action impossible : ${e.message}` : "Action impossible.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(message: Message) {
    if (!window.confirm(`Supprimer le message de ${message.name} ?`)) return;
    setBusyId(message.id);
    setError(null);
    try {
      const result = await removeMessage(message.id);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? `Suppression impossible : ${e.message}` : "Suppression impossible.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminHeading
        title="Messages"
        description="Messages reçus via le formulaire de contact du site."
      />

      <ErrorBanner message={error} />

      {messages.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-dim">
          Aucun message pour le moment — les prochains arrivages s&apos;afficheront ici.
        </Card>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li key={message.id}>
              <Card
                className={`p-5 md:p-6 ${
                  message.read ? "opacity-70" : "border-accent/35"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {message.name}
                      {!message.read && (
                        <span className="ml-2.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft">
                          Nouveau
                        </span>
                      )}
                    </p>
                    <a
                      href={`mailto:${message.email}`}
                      className="text-xs text-accent/80 underline-offset-2 hover:underline"
                    >
                      {message.email}
                    </a>
                  </div>
                  <p className="text-xs text-ink-faint">
                    {formatDate(message.created_at)} ·{" "}
                    {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-xl border border-line-soft bg-bg/50 px-4 py-3.5 text-sm leading-relaxed text-ink-dim">
                  {message.message}
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRead(message)}
                    disabled={busyId === message.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-ink-dim transition-colors hover:border-accent/50 hover:text-accent-soft disabled:opacity-50"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    {message.read ? "Marquer non lu" : "Marquer comme lu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(message)}
                    disabled={busyId === message.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-ink-dim transition-colors hover:border-red-800/50 hover:text-red-800 disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
