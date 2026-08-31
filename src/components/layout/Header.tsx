"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

const NAV_LINKS = [
  { href: "/#apropos", label: "À propos" },
  { href: "/#competences", label: "Compétences" },
  { href: "/#experiences", label: "Expériences" },
  { href: "/#projets", label: "Projets" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloque le défilement du corps quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-line bg-bg/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between md:h-20">
        {/* Marque */}
        {/* Ferme le menu mobile au clic — pas d'effect sur le pathname */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="group flex items-center gap-3"
          aria-label="Accueil"
        >
          <span className="flex h-9 w-9 items-center justify-center border border-ink bg-surface font-serif text-lg leading-none text-ink transition-colors duration-300 group-hover:border-accent">
            D<span className="text-accent">.</span>
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-serif text-[15px] tracking-tight text-ink">
              Daniel Chabi Bouko
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              Le Registre — Archiviste 2.0
            </span>
          </span>
        </Link>

        {/* Navigation bureau */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim transition-colors duration-300 hover:text-ink"
            >
              {link.label}
              <span
                className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
            </Link>
          ))}
          <Link
            href="/#contact"
            className="border border-ink/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:border-accent hover:text-accent-deep"
          >
            Me contacter
          </Link>
        </nav>

        {/* Bouton menu mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center border border-ink/40 text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile plein écran */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-bg/97 backdrop-blur-lg lg:hidden"
          >
            <nav
              className="container-site flex flex-1 flex-col justify-center gap-2"
              aria-label="Navigation mobile"
            >
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: EASE }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-line py-5 font-serif text-3xl text-ink transition-colors hover:text-accent-deep"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={reduce ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + NAV_LINKS.length * 0.06, duration: 0.4, ease: EASE }}
              >
                <Link
                  href="/#contact"
                  onClick={() => setMenuOpen(false)}
                  className="mt-6 inline-block border border-accent bg-accent px-6 py-3 text-sm font-medium text-bg-deep"
                >
                  Me contacter
                </Link>
              </motion.div>
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint"
              >
                Cotonou, Bénin — Archives · Data · Dev
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
