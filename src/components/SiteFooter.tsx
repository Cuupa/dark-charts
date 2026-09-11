'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 border-t border-border bg-background mt-12">
      <div className="container mx-auto px-4 lg:px-8 py-12 space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="display-font text-sm text-foreground">Dark Charts</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t('footer.tagline')}
            </p>
          </div>

          <nav
            className="md:col-span-2 flex flex-wrap gap-x-6 gap-y-2 text-sm uppercase tracking-wider content-start"
            aria-label={t('footer.legalNav') || 'Legal'}
          >
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.about') || 'Über uns'}
            </Link>
            <Link href="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.methodology') || 'Methodik'}
            </Link>
            <Link href="/spotlight" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.spotlight') || 'Spotlight'}
            </Link>
            <Link href="/imprint" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.imprint') || 'Impressum'}
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.privacy') || 'Datenschutz'}
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.terms') || 'AGB'}
            </Link>
          </nav>
        </div>

        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Dark Charts
        </p>
      </div>
    </footer>
  );
}
