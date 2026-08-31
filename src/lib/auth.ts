import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Authentification de l'admin — identifiant + mot de passe, cookie de
 * session signé. Aucun service externe : tout vit dans trois variables
 * d'environnement (ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET).
 *
 * Le cookie contient l'expiration et une signature HMAC-SHA256 ; il est
 * httpOnly, SameSite=Lax et Secure en production. Modifier le mot de
 * passe invalide toutes les sessions existantes.
 */

const COOKIE_NAME = "dcb_admin";
/** Durée de la session : 7 jours. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Clé de signature. SESSION_SECRET si fournie ; sinon dérivée de
 * l'identifiant + mot de passe — ce qui fait qu'un mot de passe changé
 * déconnecte toutes les sessions.
 */
function sessionSecret(): string | null {
  const explicit = process.env.SESSION_SECRET;
  if (explicit) return explicit;
  const user = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (user && password) return `${user}:${password}:dcb-registre`;
  return null;
}

/** Comparaison à temps constant (les longueurs divergent tôt, tant pis). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Compare quand même pour ne pas raccourcir le temps de réponse.
    timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Vérifie les identifiants fournis contre les variables d'admin. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPassword);
}

/** L'admin est-il configuré ? (sinon /admin/login explique quoi faire) */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

/** Pose le cookie de session après une connexion réussie. */
export async function createAdminSession(): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("Session impossible : admin non configuré.");

  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");

  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Efface le cookie de session. */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Session admin valide ? — signature + expiration vérifiées. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret) return false;

  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  return safeEqual(signature, expected);
}
