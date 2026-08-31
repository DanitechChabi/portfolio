import { NextResponse } from "next/server";
import { z } from "zod";
import { getSubscribers, putSubscriber } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Inscription à la newsletter « Le Bordereau » (popup du site public).
 *
 * Même discipline que /api/contact : validation zod, honeypot anti-spam,
 * limite de débit en mémoire. L'email est normalisé en minuscules et
 * dédoublonné — une adresse déjà inscrite reçoit le même « ok » (la
 * réponse ne révèle donc pas si une adresse figure au registre).
 *
 * Contrairement au contact, il n'y a pas de repli email : si le store
 * Blob n'est pas configuré, l'inscription échoue explicitement plutôt
 * que de se perdre en silence.
 */

const newsletterSchema = z.object({
  email: z.email("Adresse email invalide").max(200),
  // Honeypot anti-spam : champ caché que les robots remplissent. Il passe
  // la validation (max généreux) pour recevoir un faux succès plus bas —
  // le robot s'arrête là, sans savoir qu'il a été filtré.
  website: z.string().max(500).optional().or(z.literal("")),
});

/* Limite simple en mémoire : 5 inscriptions / minute / IP. */
const hits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= 5) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) hits.clear(); // garde-fou mémoire
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop d'inscriptions. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Adresse email invalide." },
      { status: 400 },
    );
  }

  // Honeypot rempli : on fait semblant de réussir (le robot s'arrête là).
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    // Dédoublonnage : une adresse déjà versée au registre ne re-crée pas
    // de fiche — la réponse reste identique pour tout le monde.
    const existing = await getSubscribers<{ email: string; created_at: string }>();
    if (!existing.some((s) => s.email === email)) {
      await putSubscriber({
        id: crypto.randomUUID(),
        email,
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter] Archivage de l'inscription impossible :", e);
    return NextResponse.json(
      {
        error:
          "L'inscription est impossible pour le moment — réessayez dans quelques instants.",
      },
      { status: 503 },
    );
  }
}
