import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getProjects } from "@/lib/github";
import { getPublishedPosts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPublishedPosts()]);

  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...projects.map((project) => ({
      url: `${SITE_URL}/projets/${project.slug}`,
      lastModified: project.pushedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_at ?? post.created_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
