// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css'; // keep your Tailwind/global styles
import Navbar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'SwasthX',
  description: 'Personalized diet and workout planner',
};

// RootLayout is the top-most wrapper for ALL pages.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* We keep the whole app on a dark background */}
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Top navigation bar is always visible */}
        <Navbar />

        {/* Main content area */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
