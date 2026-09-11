'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { NAV_ITEMS, ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

function isNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));

  const navLinkClass = (active: boolean) =>
    cn(
      'text-sm font-medium tracking-wider uppercase transition-colors rounded-md px-3 py-2',
      active
        ? 'text-primary'
        : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href={ROUTES.home}
            className="flex items-center shrink-0 focus-visible:ring-2 focus-visible:ring-ring outline-none"
            aria-label={t('a11y.home')}
          >
            <span className="display-font text-sm md:text-base text-foreground">Dark Charts</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label={t('a11y.nav')}>
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Button key={item.view} variant="ghost" asChild className={navLinkClass(active)}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </Button>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
              className="ml-2 min-w-[44px] min-h-[44px] text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground px-2 py-1"
              aria-label={t('a11y.switchLang')}
            >
              {language === 'de' ? 'EN' : 'DE'}
            </Button>

            <Button variant="ghost" size="sm" asChild className={navLinkClass(isNavActive(pathname, ROUTES.profile))}>
              <Link
                href={ROUTES.profile}
                aria-current={isNavActive(pathname, ROUTES.profile) ? 'page' : undefined}
              >
                {t('nav.profile')}
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-w-[44px] min-h-[44px]"
                  aria-label="Open menu"
                >
                  <List size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 bg-card">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="px-4 py-5 border-b border-border">
                    <p className="display-font text-sm">Dark Charts</p>
                  </div>

                  <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Mobile navigation">
                    <ul className="space-y-0.5">
                      {navItems.map((item) => {
                        const active = isNavActive(pathname, item.href);
                        return (
                          <li key={item.view}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'flex items-center rounded-md px-3 py-2.5 text-sm font-medium tracking-wider uppercase transition-colors min-h-[44px]',
                                active
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                              aria-current={active ? 'page' : undefined}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                      <li>
                        <Link
                          href={ROUTES.profile}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center rounded-md px-3 py-2.5 text-sm font-medium tracking-wider uppercase transition-colors min-h-[44px]',
                            isNavActive(pathname, ROUTES.profile)
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                          aria-current={isNavActive(pathname, ROUTES.profile) ? 'page' : undefined}
                        >
                          {t('nav.profile')}
                        </Link>
                      </li>
                    </ul>
                  </nav>

                  <div className="border-t border-border px-4 py-4 space-y-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t('profile.language')}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={language === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('en')}
                      >
                        EN
                      </Button>
                      <Button
                        variant={language === 'de' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('de')}
                      >
                        DE
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
