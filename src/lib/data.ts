import { getMessages as getStoredMessages, readCollection, readJson } from "@/lib/store";
import {
  DEFAULT_EXPERIENCES,
  DEFAULT_POSTS,
  DEFAULT_PROFILE,
  DEFAULT_SKILLS,
} from "@/lib/default-content";
import type { Experience, Message, Post, Profile, Skill } from "@/types/content";

/**
 * Couche d'accès au contenu (côté serveur).
 *
 * Tout le contenu administrable vit dans Vercel Blob (src/lib/store.ts).
 * Convention : un store jamais écrit (ou non configuré) renvoie `null`
 * → le site replie sur le contenu par défaut et reste toujours
 * affichable ; un store écrit — même vide — fait foi.
 *
 * Les projets ne passent pas par ici : ils sont lus depuis l'API GitHub
 * (voir src/lib/github.ts).
 */

/* ---------- Lectures publiques (ISR, sans session) ---------- */

export async function getProfile(): Promise<Profile> {
  return (await readJson<Profile>("data/profile.json")) ?? DEFAULT_PROFILE;
}

/** Articles publiés (site public), du plus récent au plus ancien. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = (await readCollection<Post>("posts")) ?? DEFAULT_POSTS;
  return posts
    .filter((p) => p.published)
    .sort((a, b) =>
      (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at),
    );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = (await readCollection<Post>("posts")) ?? DEFAULT_POSTS;
  return posts.find((p) => p.slug === slug && p.published) ?? null;
}

/** Compétences triées par ordre d'affichage. */
export async function getSkills(): Promise<Skill[]> {
  const skills = (await readCollection<Skill>("skills")) ?? DEFAULT_SKILLS;
  return [...skills].sort((a, b) => a.sort_order - b.sort_order);
}

/** Expériences du plus récent au plus ancien (tri par date de début). */
export async function getExperiences(): Promise<Experience[]> {
  const experiences =
    (await readCollection<Experience>("experiences")) ?? DEFAULT_EXPERIENCES;
  return [...experiences].sort((a, b) => b.start.localeCompare(a.start));
}

/* ---------- Lectures de l'administration ---------- */

/** Tous les articles, brouillons compris — derrière /admin. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await readCollection<Post>("posts");
  return [...(posts ?? DEFAULT_POSTS)].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export async function getPostById(id: number): Promise<Post | null> {
  const posts = (await readCollection<Post>("posts")) ?? DEFAULT_POSTS;
  return posts.find((p) => p.id === id) ?? null;
}

/** Messages reçus via le formulaire de contact, du plus récent au plus ancien. */
export async function getMessages(): Promise<Message[]> {
  return getStoredMessages<Message>();
}

export async function getUnreadMessageCount(): Promise<number> {
  const messages = await getStoredMessages<Message>();
  return messages.filter((m) => !m.read).length;
}
