import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import { Exo_2, Orbitron } from 'next/font/google';
import { Providers } from './providers';
import { PublicEffects } from './_components/PublicEffects';
import { ThemeLoader } from './_components/ThemeLoader';
import { NavHidingWrapper } from './_components/NavHidingWrapper';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const exo2 = Exo_2({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-exo2',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron',
  display: 'swap',
});

const fontVariables: CSSProperties = {
  ['--font-sans' as string]:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  ['--font-mono' as string]:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
};

export const metadata: Metadata = {
  title: 'Dark Charts',
  description: 'Independent music charts for the dark scene',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-visual',
  themeColor: '#0d0d1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${exo2.variable} ${orbitron.variable}`}
      style={fontVariables}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:border focus:border-accent focus:outline-none"
        >
          Skip to main content
        </a>
        <Providers>
          <ThemeLoader />
          <PublicEffects />
          <NavHidingWrapper>
            <SiteHeader />
          </NavHidingWrapper>
          {children}
          <NavHidingWrapper>
            <SiteFooter />
          </NavHidingWrapper>
        </Providers>
      </body>
    </html>
  );
}
