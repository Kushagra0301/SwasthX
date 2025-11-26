'use client';
// This component runs on the client because it uses hooks & signOut().

import { signOut } from 'next-auth/react';
// signOut() is the NextAuth client helper to log out.

export default function LogoutButton() {
  const handleLogout = () => {
    // This will call /api/auth/signout and then redirect to the homepage.
    signOut({ callbackUrl: '/' });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
    >
      Logout
    </button>
  );
}
