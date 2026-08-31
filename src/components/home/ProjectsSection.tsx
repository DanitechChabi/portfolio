import { getProjects } from "@/lib/github";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";

/**
 * Le fonds des projets — alimenté par l'API GitHub (dépôts publics),
 * mis en cache une heure côté serveur. L'explorateur client prend le
 * relais pour les filtres par casquette et les deux modes de lecture.
 */
export async function ProjectsSection() {
  const projects = await getProjects();

  return (
    <section id="projets" className="relative scroll-mt-24 py-24 md:py-32">
      <div
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-line to-transparent"
        aria-hidden
      />
      <div className="container-site">
        <Reveal>
          <SectionHeading
            cote="DCB·2026·05"
            title="Le fonds des projets"
            note="Ce registre se tient tout seul : chaque dépôt GitHub pousse ici, coté, classé, ventilé."
            description="Trois cotes de lecture — archivage, data, développement — pour le même fonds : les outils que je construis, du rayonnage à l'écran."
          />
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <ProjectsExplorer projects={projects} />
        </Reveal>
      </div>
    </section>
  );
}
