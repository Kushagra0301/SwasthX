// components/Navbar.tsx

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* LEFT: Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
        >
          SwasthX
        </Link>

        {/* RIGHT: Navigation */}
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <Link
            href="/questionnaires/diet"
            className="hover:text-white transition-colors"
          >
            Diet
          </Link>

          <Link
            href="/questionnaires/workout"
            className="hover:text-white transition-colors"
          >
            Workout
          </Link>
        </div>

      </nav>
    </header>
  );
}
