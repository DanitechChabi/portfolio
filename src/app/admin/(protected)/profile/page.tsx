import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/admin/ProfileForm";

export default async function AdminProfilePage() {
  const profile = await getProfile();
  return <ProfileForm profile={profile} />;
}
