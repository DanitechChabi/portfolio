import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Skills } from "@/components/home/Skills";
import { Experiences } from "@/components/home/Experiences";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { IndexRail } from "@/components/home/IndexRail";
import { Marquee } from "@/components/ui/Marquee";
import { getProfile } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/** Page d'accueil : Hero, À propos, Compétences, Expériences, Projets, Contact. */
export const revalidate = 60;

/** Le cycle de l'information — la bande de liaison entre les casquettes. */
const CYCLE = [
  "Trier",
  "Classer",
  "Indexer",
  "Numériser",
  "Structurer",
  "Analyser",
  "Visualiser",
  "Développer",
  "Conserver",
];

export default async function HomePage() {
  const profile = await getProfile();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.bio,
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location.split(",")[0].trim(),
      addressCountry: "BJ",
    },
    url: SITE_URL,
    sameAs: [profile.linkedin_url, profile.github_url].filter(Boolean),
    knowsAbout: [
      "Archivage numérique",
      "Gestion électronique des documents",
      "Dématérialisation",
      "Développement web",
      "Analyse de données",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Marquee items={CYCLE} />
      <About />
      <Skills />
      <Experiences />
      <ProjectsSection />
      <ContactSection />
      <IndexRail />
    </>
  );
}
