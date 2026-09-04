import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  /* Axes expressifs de la serif : douceur + irrégularité « tamponnée » */
  axes: ["SOFT", "WONK", "opsz"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Daniel CHABI BOUKO — Archiviste 2.0 · Développeur web · Data Analyst",
    template: "%s — Daniel CHABI BOUKO",
  },
  description:
    "Portfolio de Daniel CHABI BOUKO — archiviste, développeur web et data analyst à Cotonou, Bénin. GED, archivage numérique, dématérialisation et outils sur mesure pour la gestion de l'information.",
  keywords: [
    "archiviste",
    "GED",
    "gestion électronique des documents",
    "archivage numérique",
    "dématérialisation",
    "développeur web",
    "data analyst",
    "Power BI",
    "Cotonou",
    "Bénin",
  ],
  authors: [{ name: "Daniel CHABI BOUKO" }],
  creator: "Daniel CHABI BOUKO",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Daniel CHABI BOUKO",
    title: "Daniel CHABI BOUKO — Archiviste 2.0 · Développeur web · Data Analyst",
    description:
      "GED, archivage numérique, dématérialisation, développement web et analyse de données — des outils qui optimisent la gestion de l'information.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daniel CHABI BOUKO — Archiviste 2.0 · Développeur web · Data Analyst",
    description: "GED, archivage numérique, dématérialisation, développement web et analyse de données.",
  },
  robots: { index: true, follow: true },
  /* Vérification Google Search Console (propriété danielchabi.vercel.app). */
  verification: {
    google: "FicIrvfTDhIT37dmNeShPm6oX61Rt-HEUb3dcaMDyNg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ede0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="grain min-h-dvh bg-bg font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
