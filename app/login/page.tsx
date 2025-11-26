'use client';
// This tells Next.js that this component runs on the CLIENT (browser).
// We need this for React hooks like useState and for the signIn function.

import React, { useState, FormEvent } from 'react';
// React: main UI library. useState: to store form state. FormEvent: type for form submit events.

import { signIn } from 'next-auth/react';
// signIn is a helper from NextAuth that calls our /api/auth/* routes for us.

import { useRouter } from 'next/navigation';
// useRouter lets us programmatically navigate to another page (e.g., redirect to /dashboard).
export default function LoginPage() {
  // email and password: controlled inputs that store what the user types.
  const [email, setEmail] = useState('demo@swasthx.test'); // default: our demo user
  const [password, setPassword] = useState('demo1234');    // default demo password

  // loading: indicates when the login request is in progress.
  const [loading, setLoading] = useState(false);

  // error: any error message we want to show to the user.
  const [error, setError] = useState<string | null>(null);

  // router: used to redirect to /dashboard after successful login.
  const router = useRouter();

  // This function runs when the login form is submitted.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();   // Prevent default browser form submission (no page reload).
    setLoading(true);     // show loading state
    setError(null);       // clear existing errors

    // Use NextAuth's signIn helper. We specify:
    // - provider: 'credentials' (the one we configured in lib/auth.ts)
    // - email, password: values from state
    // - redirect: false → we want to handle redirect manually in code
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // res can be:
    // - { ok: true, error: null } on success
    // - { ok: false, error: 'some message' } on failure
    if (res?.error) {
      setError(res.error || 'Invalid email or password');
      setLoading(false);
      return;
    }

    // If no error, login succeeded.
    // Navigate to /dashboard.
    router.push('/dashboard');
  };

  // UI for login page
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-center">
          SwasthX Login
        </h1>
        <p className="text-sm text-zinc-400 mb-6 text-center">
          Sign in to view your saved diet & workout plans.
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-300 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* The form element */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white text-center disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Small hint showing demo credentials */}
        <p className="mt-4 text-xs text-zinc-500 text-center">
          Demo user: <span className="text-zinc-300">demo@swasthx.test</span> /{' '}
          <span className="text-zinc-300">demo1234</span>
        </p>
      </div>
    </main>
  );
}
