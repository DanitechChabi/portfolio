"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeSubscriber } from "@/lib/admin-actions";
import type { Subscriber } from "@/types/content";
import { formatDate } from "@/lib/format";
import { TrashIcon } from "@/components/ui/icons";
import { AdminHeading, Card, ErrorBanner } from "./form-ui";

/**
 * Le registre des abonnés à « Le Bordereau » — une ligne par fiche
 * d'abonnement, exportable en CSV pour alimenter un outil d'envi
 * (Resend Audiences, Buttondown…).
 */
export function SubscriberList({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(subscriber: Subscriber) {
    if (
      !window.confirm(
        `Retirer ${subscriber.email} du registre des abonnés ?`,
      )
    ) {
      return;
    }
    setBusyId(subscriber.id);
    setError(null);
    try {
      const result = await removeSubscriber(subscriber.id);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? `Suppression impossible : ${e.message}`
          : "Suppression impossible.",
      );
    } finally {
      setBusyId(null);
    }
  }

  /** CSV local (séparateur « ; » et BOM UTF-8 : s'ouvre proprement dans Excel). */
  function exportCsv() {
    const header = "email;date d'inscription";
    const rows = subscribers.map(
      (s) => `${s.email};${formatDate(s.created_at)}`,
    );
    /* BOM UTF-8 : Excel reconnaît l'encodage. */
    const csv = `﻿${[header, ...rows].join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-abonnes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <AdminHeading
        title="Newsletter"
        description={`Abonnés à « Le Bordereau » — ${subscribers.length} ${
          subscribers.length > 1 ? "fiches" : "fiche"
        } au registre.`}
        actions={
          subscribers.length > 0 ? (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-ink-dim transition-colors hover:border-accent/50 hover:text-accent-soft"
            >
              Exporter en CSV
            </button>
          ) : undefined
        }
      />

      <ErrorBanner message={error} />

      {subscribers.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-dim">
          Aucun abonné pour le moment — le popup «&nbsp;Le Bordereau&nbsp;» du
          site public alimentera cette liste à la première inscription.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bg/50"
              >
                <a
                  href={`mailto:${subscriber.email}`}
                  className="text-sm text-ink underline-offset-2 hover:text-accent-soft hover:underline"
                >
                  {subscriber.email}
                </a>
                <div className="flex items-center gap-3">
                  <p className="nums text-xs text-ink-faint">
                    {formatDate(subscriber.created_at)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(subscriber)}
                    disabled={busyId === subscriber.id}
                    aria-label={`Retirer ${subscriber.email}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-dim transition-colors hover:border-red-800/50 hover:text-red-800 disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
