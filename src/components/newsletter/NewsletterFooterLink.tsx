"use client";

import { MailIcon } from "@/components/ui/icons";
import { NEWSLETTER_OPEN_EVENT } from "./NewsletterPopup";

/**
 * Entrée « Newsletter » du pied de page — un bouton (pas un lien : la
 * fiche n'est pas une page) qui demande au popup de s'ouvrir. L'ouverture
 * manuelle ignore le refroidissement des 7 jours.
 */
export function NewsletterFooterLink() {
  return (
    <li>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT))
        }
        className="inline-flex items-center gap-2.5 text-onink-dim transition-colors hover:text-onink"
      >
        <MailIcon className="h-4 w-4" />
        Newsletter
      </button>
    </li>
  );
}
