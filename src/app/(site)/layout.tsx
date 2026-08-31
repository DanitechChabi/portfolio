import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CrosshairCursor } from "@/components/ui/CrosshairCursor";
import { NewsletterPopup } from "@/components/newsletter/NewsletterPopup";
import { ArchivistChat } from "@/components/chat/ArchivistChat";
import { isChatEnabled } from "@/lib/chat";

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
      <NewsletterPopup />
      {/* Salle de lecture — absente du HTML tant que la clé n'est pas versée. */}
      {isChatEnabled() && <ArchivistChat />}
    </div>
  );
}
