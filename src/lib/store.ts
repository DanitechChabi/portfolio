import { BlobNotFoundError, del, head, list, put } from "@vercel/blob";

/**
 * Le store de contenu — Vercel Blob, aucun service externe à gérer
 * (même dashboard Vercel, plan Hobby).
 *
 * Organisation :
 *   data/profile.json      → Profile
 *   data/posts.json        → Post[]
 *   data/skills.json       → Skill[]
 *   data/experiences.json  → Experience[]
 *   messages/{uuid}.json   → un fichier PAR message (aucune course entre
 *                            deux envois simultanés du formulaire), à nom
 *                            aléatoire — ils contiennent nom et email.
 *   newsletter/{uuid}.json → un fichier PAR abonné, à nom aléatoire —
 *                            même raison : emails à nom imprévisible.
 *   media/{dossier}/…      → images (URL publiques)
 *
 * Vercel Blob ne propose plus de blobs privés : tout est public, MAIS le
 * store n'est pas listable sans le token serveur. Un fichier à nom
 * prévisible (data/posts.json) reste donc lisible par quiconque connaît
 * l'URL du store — pas de contenu sensible dans les brouillons. Les
 * messages, eux, portent un UUID : introuvables sans token.
 *
 * Convention de repli : readJson renvoie `null` quand le fichier
 * n'existe pas (ou que le store n'est pas configuré) et `[]` quand il a
 * été écrit vide. Le site public replie sur le contenu par défaut dans
 * le premier cas ; l'admin, lui, voit la réalité du store.
 */

const isConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Erreur explicite quand on essaie d'écrire sans store configuré. */
function requireToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN manquant — créez un store Blob dans le dashboard Vercel (Storage → Blob) et ajoutez la variable.",
    );
  }
  return token;
}

/** Lit et parse un JSON depuis son URL publique (fetch non caché). */
async function readUrl(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return JSON.parse(await res.text());
  } catch (e) {
    console.error("[store] Lecture impossible :", e);
    return null;
  }
}

/**
 * Lit un JSON du store. `null` = absent / store non configuré /
 * erreur de lecture (le site replie sur le contenu par défaut).
 */
export async function readJson<T>(pathname: string): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    /* head() lève BlobNotFoundError si le fichier n'existe pas (état
       normal avant le premier enregistrement) et donne l'URL publique. */
    const meta = await head(pathname);
    return (await readUrl(meta.url)) as T | null;
  } catch (e) {
    if (!(e instanceof BlobNotFoundError)) {
      console.error(`[store] Lecture ${pathname} impossible :`, e);
    }
    return null;
  }
}

/**
 * Écrit (remplace) un JSON du store. Lève une erreur si non configuré.
 * Cache CDN ramassé au minimum (60 s) : une lecture juste après un
 * enregistrement admin ne doit pas retomber sur l'ancienne version.
 */
export async function writeJson(pathname: string, value: unknown): Promise<void> {
  requireToken();
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

/** Collection nommée → data/{nom}.json. */
export async function readCollection<T>(name: string): Promise<T[] | null> {
  return readJson<T[]>(`data/${name}.json`);
}

export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  await writeJson(`data/${name}.json`, items);
}

/* ------------------------------------------------------------------ */
/* Messages (un fichier par message, nommé par UUID)                   */
/* ------------------------------------------------------------------ */

export async function putMessage(
  message: { id: string } & Record<string, unknown>,
): Promise<void> {
  await writeJson(`messages/${message.id}.json`, message);
}

/** Tous les messages, du plus récent au plus ancien ([] si store vide). */
export async function getMessages<T extends { created_at: string }>(): Promise<T[]> {
  if (!isConfigured()) return [];
  try {
    const { blobs } = await list({ prefix: "messages/" });
    const items = await Promise.all(blobs.map((b) => readUrl(b.url)));
    return items
      .filter((m): m is T => m !== null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (e) {
    console.error("[store] Listing des messages impossible :", e);
    return [];
  }
}

/** Met à jour un message (lu/non lu) — lecture, fusion, réécriture. */
export async function patchMessage(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const current = await readJson<Record<string, unknown>>(`messages/${id}.json`);
  if (!current) throw new Error("Message introuvable dans le store.");
  await writeJson(`messages/${id}.json`, { ...current, ...patch });
}

export async function deleteMessage(id: string): Promise<void> {
  requireToken();
  await del(`messages/${id}.json`);
}

/* ------------------------------------------------------------------ */
/* Newsletter (un fichier par abonné, nommé par UUID)                  */
/* ------------------------------------------------------------------ */

export async function putSubscriber(
  subscriber: { id: string } & Record<string, unknown>,
): Promise<void> {
  await writeJson(`newsletter/${subscriber.id}.json`, subscriber);
}

/** Tous les abonnés, du plus récent au plus ancien ([] si store vide). */
export async function getSubscribers<T extends { created_at: string }>(): Promise<
  T[]
> {
  if (!isConfigured()) return [];
  try {
    const { blobs } = await list({ prefix: "newsletter/" });
    const items = await Promise.all(blobs.map((b) => readUrl(b.url)));
    return items
      .filter((s): s is T => s !== null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (e) {
    console.error("[store] Listing des abonnés impossible :", e);
    return [];
  }
}

export async function deleteSubscriber(id: string): Promise<void> {
  requireToken();
  await del(`newsletter/${id}.json`);
}

/* ------------------------------------------------------------------ */
/* Images (publiques, nom unique par horodatage)                       */
/* ------------------------------------------------------------------ */

/** Téléverse une image et renvoie son URL publique. */
export async function putImage(folder: string, file: File): Promise<string> {
  requireToken();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  /* NFD puis retrait des marques combinantes : « é » → « e ». */
  const safeName = file.name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/\.[^.]+$/, "")
    .slice(-40);
  const pathname = `media/${folder}/${Date.now()}-${safeName}.${ext}`;

  const result = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return result.url;
}
