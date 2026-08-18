import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/NavBar';
import { ToastProvider } from '@/components/Toast';
import { DisclaimerProvider } from '@/components/DisclaimerProvider';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SwasthX',
  description: 'Personalized diet and workout planner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-ink font-body text-text">
        <ToastProvider>
          <DisclaimerProvider>
            <Navbar />
            <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
          </DisclaimerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
