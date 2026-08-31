import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Autorise les images servies depuis Vercel Blob (media/…) ou toute URL
    // https renseignée dans l'admin (avatars, images de blog).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    /* Les images OpenGraph (Satori + resvg-wasm) sont gourmandes : en
       parallèle sur de nombreux cœurs, les workers de build épuisent la
       mémoire. Deux workers suffisent — le site est petit. */
    cpus: 2,
  },
};

export default nextConfig;
