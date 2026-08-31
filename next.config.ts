import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Autorise les images servies depuis Vercel Blob (media/…) ou toute URL
    // https renseignée dans l'admin (avatars, images de blog).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
