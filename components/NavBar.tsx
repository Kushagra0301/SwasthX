"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaAppleAlt, FaDumbbell, FaHome, FaFire, FaBars, FaTimes } from "react-icons/fa";

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
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setShowDisclaimer(false)}
          />

          {/* Modal */}
          <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl w-full max-w-md animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-zinc-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-100">Important Disclaimer</h3>
                  <p className="text-sm text-zinc-400 mt-1">Please read carefully before proceeding</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-zinc-300 text-center">
                  <span className="font-semibold text-red-400">SwasthX</span> provides fitness and diet
                  plans for informational purposes only.
                </p>

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-zinc-300">
                        <span className="font-medium">Not Medical Advice:</span> These plans are not
                        substitutes for professional medical advice, diagnosis, or treatment.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-zinc-300">
                        <span className="font-medium">No Responsibility:</span> SwasthX does not take any
                        responsibility for any injuries, health issues, or damages resulting from following
                        these plans.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-zinc-300">
                        <span className="font-medium">Consult Professionals:</span> Always consult with
                        qualified healthcare providers, nutritionists, or fitness trainers before starting any
                        new program.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-zinc-300">
                        <span className="font-medium">Personal Responsibility:</span> You are solely
                        responsible for your health, safety, and well-being. Use these plans at your own
                        risk.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-zinc-300">
                        <span className="font-medium">Individual Results May Vary:</span> Results depend on
                        various factors including genetics, consistency, diet, and overall health.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-4 border border-red-500/20">
                  <span className="text-2xl mt-0.5">💡</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-1">Important Note:</p>
                    <p className="text-sm text-zinc-400">
                      These plans are for general guidance only. What works for one person may not work for
                      another. Listen to your body and adjust accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-zinc-700/50">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAcceptDisclaimer}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  I Understand & Accept All Terms
                </button>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-medium rounded-xl border border-zinc-700/50 transition-all duration-300 hover:border-zinc-600"
                >
                  Cancel
                </button>
                <p className="text-xs text-center text-zinc-500 pt-2">
                  By clicking "I Understand & Accept All Terms", you acknowledge that you have read and
                  agree to this disclaimer.
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
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
    </>
  );
}