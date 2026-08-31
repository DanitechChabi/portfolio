"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/admin-actions";
import {
  DashboardIcon,
  FileTextIcon,
  InboxIcon,
  LogoutIcon,
  ParcoursIcon,
  SkillsIcon,
  UserIcon,
} from "@/components/ui/icons";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: DashboardIcon },
  { href: "/admin/parcours", label: "Parcours", icon: ParcoursIcon },
  { href: "/admin/competences", label: "Compétences", icon: SkillsIcon },
  { href: "/admin/posts", label: "Articles", icon: FileTextIcon },
  { href: "/admin/messages", label: "Messages", icon: InboxIcon },
  { href: "/admin/profile", label: "Profil", icon: UserIcon },
];

export function AdminShell({
  children,
  userLabel,
  unreadCount,
}: {
  children: React.ReactNode;
  userLabel: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logoutAction();
    } catch {
      setSigningOut(false);
    }
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const navLinks = (direction: "vertical" | "horizontal") => (
    <nav
      aria-label="Navigation administration"
      className={
        direction === "vertical"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto pb-1"
      }
    >
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition-colors duration-200 ${
            isActive(href)
              ? "bg-accent/15 text-accent-soft"
              : "text-onink-dim hover:bg-onink/10 hover:text-onink"
          }`}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          {label}
          {href === "/admin/messages" && unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-bg-deep">
              {unreadCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg">
      {/* Barre latérale — grand écran */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-onink/15 bg-bg-deep lg:flex">
        <div className="flex items-center gap-3 border-b border-onink/15 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-onink/25 font-serif text-lg leading-none text-onink">
            D<span className="text-accent-soft">.</span>
          </span>
          <div>
            <p className="font-serif text-[15px] tracking-tight text-onink">
              Administration
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-onink-faint">
              Portfolio DCB
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">{navLinks("vertical")}</div>

        <div className="border-t border-onink/15 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-onink/25 bg-onink/10 text-xs font-semibold text-accent-soft">
              {userLabel.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-onink">@{userLabel}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-onink-faint">
                Connecté
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-onink-dim transition-colors hover:bg-onink/10 hover:text-red-300 disabled:opacity-60"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
            {signingOut ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      </aside>

      {/* Barre supérieure — mobile */}
      <div className="sticky top-0 z-40 border-b border-onink/15 bg-bg-deep/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-onink/25 font-serif text-base leading-none text-onink">
              D<span className="text-accent-soft">.</span>
            </span>
            <p className="font-serif text-sm text-onink">Administration</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-full border border-onink/25 px-3.5 py-1.5 text-xs text-onink-dim transition-colors hover:text-red-300 disabled:opacity-60"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            Quitter
          </button>
        </div>
        <div className="px-3 pb-3">{navLinks("horizontal")}</div>
      </div>

      {/* Contenu */}
      <main className="px-5 py-8 md:px-10 md:py-10 lg:ml-64 lg:px-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
