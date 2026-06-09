import type { Metadata } from 'next';
import { Mona_Sans, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const monaSans = Mona_Sans({
  subsets: ['latin'],
  variable: '--font-mona-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Taaxbro — Business Finances, Finally Under Control',
  description:
    'Payments, tax compliance, and bookkeeping — powered by AI, built for Nigerian businesses.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      className={`${monaSans.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning>
      <body>
        <ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider>
      </body>
    </html>
  );
}