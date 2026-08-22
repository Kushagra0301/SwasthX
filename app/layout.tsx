import type { Metadata } from 'next';
import { Space_Grotesk, Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/NavBar';
import { ToastProvider } from '@/components/Toast';
import { DisclaimerProvider } from '@/components/DisclaimerProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SwasthX',
  description:
    'Diet and workout plans calculated from your own numbers. No account, no email, PDF in one session.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${archivo.variable} ${jetbrainsMono.variable}`}
    >
      <body className="grain min-h-screen bg-ink font-body text-text antialiased">
        <ToastProvider>
          <DisclaimerProvider>
            <Navbar />
            {children}
          </DisclaimerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
