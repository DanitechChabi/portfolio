import { NextResponse } from "next/server";
import { z } from "zod";
import { buildChatContext, chatModel, isChatEnabled } from "@/lib/chat";
import { CHAT_DAILY_LIMIT, dailyQuotaCookie, readDailyQuota } from "@/lib/chat-quota";
import { SITE_URL } from "@/lib/site";

/**
 * Route du chat « L'Archiviste » — inscription au registre des
 * consultations.
 *
 * Même discipline que /api/contact et /api/newsletter : validation zod,
 * honeypot anti-spam, limite de débit en mémoire. S'y ajoute un quota
 * journalier par navigateur (cookie signé — voir src/lib/chat-quota.ts)
 * : le chat appelle un modèle payant, il faut un plafond qui tienne
 * toute la journée.
 *
 * L'appel au modèle part d'ici uniquement — la clé OpenRouter ne quitte
 * jamais le serveur. La réponse arrive en flux (SSE) : `{"delta": "…"}`
 * pour chaque fragment, `{"done": true}` en fin, `{"error": "…"}` en
 * repli. Aucune conversation n'est conservée : seules les erreurs
 * techniques sont journalisées, jamais le contenu.
 */

export const runtime = "nodejs";

/* Repli in-character — jamais d'erreur technique brute au visiteur. */
const REGISTRE_INDISPONIBLE =
  "Le registre est momentanément indisponible — repassez plus tard, ou écrivez via le formulaire de contact de la page d'accueil.";

/** Tours de conversation conservés en contexte (au-delà : troncature). */
const MAX_HISTORY = 8;
/**
 * Plafond de sortie, en tokens. Large : le modèle gratuit par défaut
 * (Ling) réfléchit longuement dans un champ séparé que la route ne
 * transmet pas — il faut lui laisser la place de finir sa réflexion
 * avant d'écrire la réponse visible. Le texte transmis reste court,
 * borné par les règles du prompt (2 à 5 phrases).
 */
const MAX_OUTPUT_TOKENS = 2000;

const chatSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(1200),
        }),
      )
      .min(1)
      .max(24),
    // Honeypot anti-spam : champ caché que les robots remplissent. Il passe
    // la validation (max généreux) pour recevoir un faux succès — le robot
    // s'arrête là, sans savoir qu'il a été filtré.
    website: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const last = val.messages[val.messages.length - 1];
    if (!last || last.role !== "user") {
      ctx.addIssue({
        code: "custom",
        message: "La consultation doit se terminer par une demande.",
      });
    } else if (last.content.length > 800) {
      ctx.addIssue({ code: "custom", message: "La demande est trop longue." });
    }
  });

/* Limite simple en mémoire : 5 consultations / minute / IP. */
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

/** Trame SSE : une ligne `data:` par évènement. */
function sse(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  if (!isChatEnabled()) {
    return NextResponse.json(
      { error: "La salle de lecture est fermée pour l'instant — écrivez via le formulaire de contact de la page d'accueil." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de questions d'un coup — l'Archiviste vous prie de reprendre dans une minute." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }

  // Honeypot rempli : on fait semblant de réussir (le robot s'arrête là).
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  /* Quota journalier — compteur signé porté par le navigateur. */
  const used = await readDailyQuota();
  if (used >= CHAT_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Le quota de consultations du jour est épuisé — repassez demain, ou écrivez via le formulaire de contact." },
      { status: 429 },
    );
  }

  /* Contexte : règles de l'Archiviste + FONDS (contenu réel du site). */
  let context: string;
  try {
    context = await buildChatContext();
  } catch (e) {
    console.error("[chat] Construction du contexte impossible :", e);
    return NextResponse.json({ error: REGISTRE_INDISPONIBLE }, { status: 503 });
  }

  const history = parsed.data.messages.slice(-MAX_HISTORY);

  /* Appel OpenRouter — en flux, plafonné en sortie. */
  let upstream: Response;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        // Valeur ASCII : un en-tête HTTP n'accepte pas les tirets cadratins.
        "X-Title": "Le Registre - L'Archiviste",
      },
      body: JSON.stringify({
        model: chatModel(),
        stream: true,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
        messages: [{ role: "system", content: context }, ...history],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    console.error("[chat] OpenRouter injoignable :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: REGISTRE_INDISPONIBLE }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("[chat] OpenRouter a refusé :", upstream.status, detail.slice(0, 300));
    return NextResponse.json({ error: REGISTRE_INDISPONIBLE }, { status: 502 });
  }

  /* Le quota est consommé dès que la consultation est acceptée. */
  const cookie = dailyQuotaCookie(used + 1);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamReader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      const emit = (payload: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sse(payload)));

      try {
        for (;;) {
          const { done, value } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue; // battements de cœur
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) emit({ delta });
            } catch {
              /* fragment de ligne — le tampon attendra la suite */
            }
          }
        }
        emit({ done: true });
      } catch (e) {
        console.error("[chat] Flux interrompu :", e instanceof Error ? e.message : e);
        emit({ error: REGISTRE_INDISPONIBLE });
      } finally {
        controller.close();
      }
    },
    cancel() {
      void upstreamReader.cancel();
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  });
  if (cookie) headers.set("Set-Cookie", cookie);

  return new Response(stream, { headers });
}
