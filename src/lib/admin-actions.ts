"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  isAdminAuthenticated,
  verifyCredentials,
} from "@/lib/auth";
import {
  deleteMessage,
  deleteSubscriber,
  patchMessage,
  putImage,
  readCollection,
  writeCollection,
  writeJson,
} from "@/lib/store";
import {
  DEFAULT_EXPERIENCES,
  DEFAULT_POSTS,
  DEFAULT_PROFILE,
  DEFAULT_SKILLS,
} from "@/lib/default-content";
import type { Experience, Hat, Post, Profile, Skill } from "@/types/content";

/**
 * Toutes les mutations de l'administration. Chaque action vérifie la
 * session admin (cookie signé — src/lib/auth.ts) avant d'écrire dans le
 * store Blob, puis invalide les pages publiques concernées.
 *
 * Premier enregistrement : si le store n'a jamais été écrit, la
 * collection est d'abord materialisée à partir du contenu par défaut —
 * on ne peut donc pas « perdre » les articles existants en créant le
 * premier élément.
 */

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Non autorisé — reconnectez-vous.");
  }
}

/* ------------------------------------------------------------------ */
/* Connexion / déconnexion                                             */
/* ------------------------------------------------------------------ */

/* Limite en mémoire : 5 essais / minute / IP (comme /api/contact). */
const loginHits = new Map<string, number[]>();

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (loginHits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  loginHits.set(ip, recent);
  if (loginHits.size > 1000) loginHits.clear();
  return false;
}

export async function loginAction(
  username: string,
  password: string,
): Promise<ActionResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      error:
        "Administrateur non configuré — définissez ADMIN_USERNAME et ADMIN_PASSWORD dans les variables d'environnement.",
    };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
  if (isLoginRateLimited(ip)) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans une minute." };
  }

  if (!verifyCredentials(username.trim(), password)) {
    return { ok: false, error: "Identifiant ou mot de passe incorrect." };
  }

  await createAdminSession();
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Profil                                                              */
/* ------------------------------------------------------------------ */

export async function saveProfile(profile: Profile): Promise<ActionResult> {
  await requireAdmin();
  if (!profile.name.trim() || !profile.title.trim()) {
    return { ok: false, error: "Le nom et le titre sont obligatoires." };
  }
  try {
    await writeJson("data/profile.json", { ...DEFAULT_PROFILE, ...profile });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Articles                                                            */
/* ------------------------------------------------------------------ */

export type PostInput = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  published: boolean;
  published_at: string | null;
};

export async function savePost(input: PostInput): Promise<ActionResult> {
  await requireAdmin();

  const title = input.title.trim();
  const slug = input.slug.trim();
  if (!title || !slug || !input.content.trim()) {
    return { ok: false, error: "Le titre, le slug et le contenu sont obligatoires." };
  }

  try {
    /* Premier écriture : on part du contenu par défaut. */
    const posts = (await readCollection<Post>("posts")) ?? [...DEFAULT_POSTS];

    if (posts.some((p) => p.slug === slug && p.id !== input.id)) {
      return { ok: false, error: `Le slug « ${slug} » est déjà utilisé par un autre article.` };
    }

    if (input.id) {
      const index = posts.findIndex((p) => p.id === input.id);
      if (index === -1) return { ok: false, error: "Article introuvable — recharger la page." };
      posts[index] = { ...posts[index], ...input, id: input.id, title, slug };
    } else {
      posts.push({
        ...input,
        id: Date.now(),
        title,
        slug,
        created_at: new Date().toISOString(),
      });
    }

    await writeCollection("posts", posts);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

export async function deletePost(id: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    const posts = (await readCollection<Post>("posts")) ?? [...DEFAULT_POSTS];
    await writeCollection("posts", posts.filter((p) => p.id !== id));
    revalidatePath("/");
    revalidatePath("/blog");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Compétences                                                         */
/* ------------------------------------------------------------------ */

export type SkillInput = {
  id?: number;
  name: string;
  category: string;
  level: number;
  sort_order: number;
};

export async function saveSkill(input: SkillInput): Promise<ActionResult> {
  await requireAdmin();

  const name = input.name.trim();
  const category = input.category.trim();
  if (!name || !category) {
    return { ok: false, error: "Le nom et la catégorie sont obligatoires." };
  }
  const level = Math.min(5, Math.max(1, Math.round(input.level) || 3));

  try {
    const skills = (await readCollection<Skill>("skills")) ?? [...DEFAULT_SKILLS];

    if (input.id) {
      const index = skills.findIndex((s) => s.id === input.id);
      if (index === -1) return { ok: false, error: "Compétence introuvable — recharger la page." };
      skills[index] = { ...skills[index], ...input, id: input.id, name, category, level };
    } else {
      skills.push({
        id: Date.now(),
        name,
        category,
        level,
        sort_order: input.sort_order,
      });
    }

    await writeCollection("skills", skills);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

export async function deleteSkill(id: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    const skills = (await readCollection<Skill>("skills")) ?? [...DEFAULT_SKILLS];
    await writeCollection("skills", skills.filter((s) => s.id !== id));
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Parcours (expériences)                                              */
/* ------------------------------------------------------------------ */

export type ExperienceInput = Omit<Experience, "id"> & { id?: number };

const HATS: Hat[] = ["archives", "data", "dev"];

export async function saveExperience(input: ExperienceInput): Promise<ActionResult> {
  await requireAdmin();

  const role = input.role.trim();
  const org = input.org.trim();
  const period = input.period.trim();
  const start = input.start.trim();
  if (!role || !org || !period || !/^\d{4}-\d{2}$/.test(start)) {
    return {
      ok: false,
      error: "Rôle, organisation, période et date de début (AAAA-MM) sont obligatoires.",
    };
  }

  const hats = input.hats.filter((h): h is Hat => HATS.includes(h));
  if (hats.length === 0) {
    return { ok: false, error: "Choisissez au moins une casquette pour cette expérience." };
  }

  /* Base sans id (défini à l'insertion / conservé à l'édition). */
  const base = {
    ...input,
    role,
    org,
    period,
    start,
    cote: input.cote.trim() || `EXP·${start.slice(0, 4)}`,
    summary: input.summary?.trim() || undefined,
    highlights: input.highlights?.map((h) => h.trim()).filter(Boolean) ?? undefined,
    hats,
  };

  try {
    const experiences =
      (await readCollection<Experience>("experiences")) ?? [...DEFAULT_EXPERIENCES];

    if (input.id) {
      const index = experiences.findIndex((e) => e.id === input.id);
      if (index === -1) return { ok: false, error: "Expérience introuvable — recharger la page." };
      experiences[index] = { ...base, id: input.id };
    } else {
      experiences.push({ ...base, id: Date.now() });
    }

    await writeCollection("experiences", experiences);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

export async function deleteExperience(id: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    const experiences =
      (await readCollection<Experience>("experiences")) ?? [...DEFAULT_EXPERIENCES];
    await writeCollection("experiences", experiences.filter((e) => e.id !== id));
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await patchMessage(id, { read });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Action impossible." };
  }
}

export async function removeMessage(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteMessage(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export async function removeSubscriber(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteSubscriber(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_MB = 5;

export async function uploadImage(folder: string, file: File): Promise<UploadResult> {
  await requireAdmin();

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Ce fichier n'est pas une image." };
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return { ok: false, error: `Image trop lourde (max ${MAX_IMAGE_MB} Mo).` };
  }

  try {
    const url = await putImage(folder, file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec du téléversement." };
  }
}
