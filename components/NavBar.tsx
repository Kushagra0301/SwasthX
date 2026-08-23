"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiListBold, PiXBold, PiArrowRightBold } from "react-icons/pi";
import { useDisclaimer } from "@/components/DisclaimerProvider";
import { useScrollLock } from "@/lib/useScrollLock";
import MagneticButton from "@/components/MagneticButton";
import Button from "@/components/ui/Button";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/questionnaires/diet", label: "Diet" },
  { href: "/questionnaires/workout", label: "Workout" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { navigateWithDisclaimer } = useDisclaimer();

  useScrollLock(isMobileMenuOpen);

  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          isScrolled
            ? "border-b border-hairline bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
          <Link
            href="/"
            className="group flex items-baseline gap-[3px] font-display text-[1.15rem] font-bold tracking-[-0.03em] text-text"
          >
            Swasth
            <span className="text-accent-text transition-colors duration-200 group-hover:text-white">
              X
            </span>
          </Link>

          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-1 border-r border-hairline pr-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const className = `relative rounded-[var(--r-control)] px-3.5 py-2 text-sm transition-colors duration-200 ${
                  active ? "text-text" : "text-muted hover:text-text"
                }`;
                const underline = active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3.5 -bottom-[1px] h-px bg-accent-text"
                  />
                ) : null;

                return item.href === "/" ? (
                  <Link key={item.href} href={item.href} className={className}>
                    {item.label}
                    {underline}
                  </Link>
                ) : (
                  <button
                    key={item.href}
                    onClick={() => navigateWithDisclaimer(item.href)}
                    className={className}
                  >
                    {item.label}
                    {underline}
                  </button>
                );
              })}
            </div>

            <MagneticButton className="ml-3">
              <Button
                onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
              >
                Build a plan
                <PiArrowRightBold aria-hidden="true" />
              </Button>
            </MagneticButton>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="rounded-[var(--r-control)] border border-hairline bg-raised p-2.5 text-text shadow-[var(--inset-edge)] transition-colors hover:border-edge md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <PiXBold className="text-lg" />
            ) : (
              <PiListBold className="text-lg" />
            )}
          </button>
        </nav>
      </header>

      <div
        className={`fixed inset-x-0 bottom-0 top-16 z-40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div
          className="absolute inset-0 bg-ink/95 backdrop-blur-xl"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="relative flex h-full flex-col px-5 pb-10 pt-6">
          <div className="flex flex-col">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const className = `flex items-center justify-between border-b border-hairline py-5 text-left font-display text-2xl tracking-[-0.02em] transition-colors ${
                active ? "text-text" : "text-muted"
              }`;
              const chevron = (
                <PiArrowRightBold
                  aria-hidden="true"
                  className={active ? "text-accent-text" : "text-faint"}
                />
              );

              return item.href === "/" ? (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                  {chevron}
                </Link>
              ) : (
                <button
                  key={item.href}
                  onClick={() => navigateWithDisclaimer(item.href)}
                  className={className}
                >
                  {item.label}
                  {chevron}
                </button>
              );
            })}
          </div>

          <div className="mt-auto">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
            >
              Build a plan
              <PiArrowRightBold aria-hidden="true" />
            </Button>
            <p className="mt-4 text-center text-sm text-faint">
              Free, no account, PDF at the end.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
