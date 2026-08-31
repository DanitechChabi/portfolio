import { getProfile } from "@/lib/data";
import { HeroInner } from "./HeroInner";

export async function Hero() {
  const profile = await getProfile();
  return <HeroInner profile={profile} />;
}
