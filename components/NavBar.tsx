// components/Navbar.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaAppleAlt, FaDumbbell, FaHome, FaFire, FaBars, FaTimes } from "react-icons/fa";
import DisclaimerModal from "@/components/DisclaimerModal"; // Adjust path as needed

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDisclaimer || isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDisclaimer, isMobileMenuOpen]);

  const handleLinkClick = (url: string) => {
    setRedirectUrl(url);
    setShowDisclaimer(true);
  };

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: <FaHome /> },
    { href: "/questionnaires/diet", label: "Diet", icon: <FaAppleAlt /> },
    { href: "/questionnaires/workout", label: "Workout", icon: <FaDumbbell /> },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50 py-3 shadow-2xl"
            : "bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-md py-4"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                SwasthX
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Transform Your Health</p>
            </div>
          </Link>
          {/* Desktop Navigation - FIXED CLICKABLE AREA */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const needsDisclaimer = item.href !== "/";
              return (
                <div key={item.href} className="relative">
                  {needsDisclaimer ? (
                    <button
                      onClick={() => handleLinkClick(item.href)}
                      className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                        active
                          ? "text-white bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-inner"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                      }`}
                      style={{ position: "relative", zIndex: 10 }}
                    >
                      <span
                        className={`text-sm ${active ? "text-blue-400" : "text-zinc-500 group-hover:text-blue-400"}`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                        active
                          ? "text-white bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-inner"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                      }`}
                      style={{ position: "relative", zIndex: 10 }}
                    >
                      <span
                        className={`text-sm ${active ? "text-blue-400" : "text-zinc-500 group-hover:text-blue-400"}`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  )}

                  {/* Active indicator - BELOW the link */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  )}
                </div>
              );
            })}

            {/* CTA Button - FIXED */}
            <div className="relative ml-2">
              <button
                onClick={() => handleLinkClick("/questionnaires/diet")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-sm relative overflow-hidden group"
              >
                <FaFire className="text-xs" />
                <span>Get Started</span>
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1">
                  →
                </span>

                {/* Shine effect - fixed to not interfere with click */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 active:scale-95"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-xl text-zinc-300" />
            ) : (
              <FaBars className="text-xl text-zinc-300" />
            )}
          </button>
        </nav>
      </header>
      {/* Mobile Menu Overlay - FIXED CLICKABILITY */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-in-out ${
          isMobileMenuOpen
            ? "bg-zinc-950/95 backdrop-blur-xl opacity-100 visible"
            : "bg-transparent backdrop-blur-0 opacity-0 invisible"
        }`}
        style={{ top: "80px" }}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="px-4 py-6 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="max-w-md mx-auto bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl p-4">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              const needsDisclaimer = item.href !== "/";
              return needsDisclaimer ? (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={`flex items-center gap-3 p-4 rounded-xl mb-2 transition-all duration-300 active:scale-95 ${
                    active
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                      : "bg-zinc-800/30 text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    display: "block",
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        active ? "bg-gradient-to-br from-blue-500 to-purple-500" : "bg-zinc-700/50"
                      }`}
                    >
                      <span className={`text-lg ${active ? "text-white" : "text-zinc-400"}`}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-zinc-500">
                        {item.href === "/" && "Home page"}
                        {item.href === "/questionnaires/diet" && "Create diet plan"}
                        {item.href === "/questionnaires/workout" && "Create workout plan"}
                      </p>
                    </div>
                    {active && (
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse ml-2"></div>
                    )}
                  </div>
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-4 rounded-xl mb-2 transition-all duration-300 active:scale-95 ${
                    active
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                      : "bg-zinc-800/30 text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    display: "block",
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        active ? "bg-gradient-to-br from-blue-500 to-purple-500" : "bg-zinc-700/50"
                      }`}
                    >
                      <span className={`text-lg ${active ? "text-white" : "text-zinc-400"}`}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-zinc-500">
                        {item.href === "/" && "Home page"}
                        {item.href === "/questionnaires/diet" && "Create diet plan"}
                        {item.href === "/questionnaires/workout" && "Create workout plan"}
                      </p>
                    </div>
                    {active && (
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse ml-2"></div>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Mobile CTA - FIXED */}
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <button
                onClick={() => handleLinkClick("/questionnaires/diet")}
                className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-center flex items-center justify-center gap-2 active:scale-95"
              >
                <FaFire />
                <span>Start Your Journey</span>
              </button>
              <p className="text-xs text-center text-zinc-500 mt-3">Free • Instant • PDF Downloadable</p>
            </div>
          </div>
        </div>
      </div>
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-20 md:h-24"></div>
      {/* Custom animations - SIMPLIFIED */}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        /* Ensure buttons are properly clickable */
        a,
        button {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        /* Prevent text selection on buttons */
        .active\\:scale-95:active {
          transform: scale(0.95);
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          a,
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>

      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onClose={() => setShowDisclaimer(false)} 
        onAccept={handleAcceptDisclaimer} 
      />
    </>
  );
}