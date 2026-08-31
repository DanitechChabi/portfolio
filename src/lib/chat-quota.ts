import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Quota journalier du chat « L'Archiviste » (src/lib/chat-quota.ts).
 *
 * La limite par minute vit en mémoire (comme contact/newsletter) mais
 * les instances serverless ne partagent rien : pour un plafond
 * journalier qui tienne, chaque navigateur porte son compteur dans un
 * cookie signé — même mécanique que la session admin (HMAC-SHA256,
 * base64url), avec une clé dérivée de la clé OpenRouter pour rester
 * indépendant du mot de passe admin.
 *
 * Format : `AAAA-MM-JJ.compteur.signature`. Un cookie absent, périmé
 * (autre jour) ou maquillé vaut zéro. Effacer ses cookies remet le
 * compteur à zéro — la limite par minute, elle, tient toujours.
 */

const QUOTA_COOKIE = "dcb_chat_jour";
const MAX_AGE_SECONDS = 60 * 60 * 24;

/** Consultations accordées par jour et par navigateur. */
export const CHAT_DAILY_LIMIT = 50;

/** Clé de signature — dédiée au quota, dérivée de la clé du chat. */
function quotaSecret(): string | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  return `${key}:dcb-chat-quota`;
}

/** Comparaison à temps constant (même discipline que auth.ts). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Jour courant en UTC — le compteur retombe à zéro à chaque changement. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Compteur du jour pour ce navigateur — 0 si absent, périmé ou maquillé. */
export async function readDailyQuota(): Promise<number> {
  const secret = quotaSecret();
  if (!secret) return CHAT_DAILY_LIMIT; // sans clé : le chat est fermé

  const store = await cookies();
  const token = store.get(QUOTA_COOKIE)?.value;
  if (!token) return 0;

  const parts = token.split(".");
  if (parts.length !== 3) return 0;
  const [day, count, signature] = parts;

  if (day !== today()) return 0;
  const parsed = Number(count);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) return 0;

  const payload = `${day}.${parsed}`;
  if (!safeEqual(signature, sign(payload, secret))) return 0;
  return parsed;
}

/**
 * Sérialise le compteur incrémenté pour un en-tête `Set-Cookie` — la
 * route pose le cookie elle-même, ce qui reste fiable sur une réponse
 * en flux (streaming) où `cookies().set()` n'est pas garanti.
 */
export function dailyQuotaCookie(count: number): string {
  const secret = quotaSecret();
  if (!secret) return "";
  const payload = `${today()}.${count}`;
  const attrs = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") attrs.push("Secure");
  return `${QUOTA_COOKIE}=${payload}.${sign(payload, secret)}; ${attrs.join("; ")}`;
}
