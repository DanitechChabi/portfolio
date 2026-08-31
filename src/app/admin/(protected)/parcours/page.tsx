import { getExperiences } from "@/lib/data";
import { ExperiencesManager } from "@/components/admin/ExperiencesManager";

export const metadata = { title: "Parcours — Administration" };

export default async function AdminParcoursPage() {
  const experiences = await getExperiences();
  return <ExperiencesManager experiences={experiences} />;
}
