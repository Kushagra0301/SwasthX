// components/Navbar.tsx

import Link from 'next/link';
// Link is used for client-side navigation between pages.

import { auth } from '@/lib/auth';
// auth() lets us get the current session on the server.

import LogoutButton from './LogoutButton';
// Client component that will call signOut() when clicked.

export default async function Navbar() {
  // Get the current session (if user is logged in).
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userEmail = session?.user?.email ?? null;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LEFT: Brand + main links */}
        <div className="flex items-center gap-6">
          {/* Brand / Logo */}
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SwasthX
          </Link>

          {/* Main navigation links */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-300">
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
            {/* Dashboard only really makes sense when logged in */}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: User info + Auth actions */}
        <div className="flex items-center gap-3 text-sm">
          {isLoggedIn && userEmail && (
            <span className="hidden sm:inline text-zinc-400">
              {userEmail}
            </span>
          )}

          {/* If not logged in → show Login button */}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-200 text-xs sm:text-sm hover:bg-zinc-800 transition-colors"
            >
              Login
            </Link>
          )}

          {/* If logged in → show Logout button */}
          {isLoggedIn && <LogoutButton />}
        </div>
      </nav>
    </header>
  );
}
