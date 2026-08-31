import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CrosshairCursor } from "@/components/ui/CrosshairCursor";

/** Layout du site public (l'admin a son propre chrome). */
export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <CrosshairCursor />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
