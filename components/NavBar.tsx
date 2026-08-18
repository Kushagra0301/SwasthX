"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiHeart, FiActivity, FiMenu, FiX } from "react-icons/fi";
import { useDisclaimer } from "@/components/DisclaimerProvider";
import { useScrollLock } from "@/lib/useScrollLock";
import TextRoll from "@/components/TextRoll";
import MagneticButton from "@/components/MagneticButton";

const navItems = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/questionnaires/diet", label: "Diet", icon: FiHeart },
  { href: "/questionnaires/workout", label: "Workout", icon: FiActivity },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { navigateWithDisclaimer } = useDisclaimer();

  useScrollLock(isMobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const handleLinkClick = (url: string) => navigateWithDisclaimer(url);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-border bg-ink/95 py-3 backdrop-blur-xl"
            : "bg-ink/80 py-4 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-ink">
              S
            </span>
            <div className="hidden md:block">
              <p className="font-display text-lg font-semibold leading-none text-text">SwasthX</p>
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Transform your health</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const className = `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active ? "text-text bg-surface-raised" : "text-text-muted hover:bg-surface hover:text-text"
              }`;
              return item.href === "/" ? (
                <Link key={item.href} href={item.href} className={className}>
                  <Icon aria-hidden="true" />
                  <TextRoll>{item.label}</TextRoll>
                </Link>
              ) : (
                <button key={item.href} onClick={() => handleLinkClick(item.href)} className={className}>
                  <Icon aria-hidden="true" />
                  <TextRoll>{item.label}</TextRoll>
                </button>
              );
            })}

            <MagneticButton className="ml-2">
              <button
                onClick={() => handleLinkClick("/questionnaires/diet")}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent-hover"
              >
                Get started
              </button>
            </MagneticButton>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="rounded-lg border border-border p-2.5 text-text md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        style={{ top: "72px" }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="absolute inset-0 bg-ink/95 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="relative h-full overflow-y-auto px-4 py-6" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const className = `mb-2 flex items-center gap-3 rounded-xl p-4 transition-colors ${
                active ? "border border-accent/30 bg-accent/10 text-text" : "text-text-muted hover:bg-surface-raised hover:text-text"
              }`;
              const content = (
                <>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-accent text-ink" : "bg-surface-raised text-text-muted"}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </>
              );
              return item.href === "/" ? (
                <Link key={item.href} href={item.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button key={item.href} onClick={() => handleLinkClick(item.href)} className={`w-full text-left ${className}`}>
                  {content}
                </button>
              );
            })}

            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={() => handleLinkClick("/questionnaires/diet")}
                className="block w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-ink transition-colors hover:bg-accent-hover"
              >
                Start your journey
              </button>
              <p className="mt-3 text-center text-xs text-text-muted">Free &bull; Instant &bull; PDF downloadable</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 md:h-24" />
    </>
  );
}
