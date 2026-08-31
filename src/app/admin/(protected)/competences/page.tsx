import { getSkills } from "@/lib/data";
import { SkillsManager } from "@/components/admin/SkillsManager";

export const metadata = { title: "Compétences — Administration" };

export default async function AdminSkillsPage() {
  const skills = await getSkills();
  return <SkillsManager skills={skills} />;
}
