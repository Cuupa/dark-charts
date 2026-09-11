'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, ArrowUpRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const items = [{ href: '/', label: t('nav.home') }, { href: '/search', label: t('ui.discover') }, { href: '/history', label: t('nav.history') }, { href: '/custom-charts', label: t('nav.custom') }];
  const active = (href: string) => href === '/' ? pathname === '/' || pathname.startsWith('/charts/') || pathname.startsWith('/genre/') : pathname.startsWith(href);
  const links = items.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active(item.href) ? 'page' : undefined} className={cn('site-nav-link', active(item.href) && 'is-active')}>{item.label}</Link>);
  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" aria-label={t('a11y.home')} className="brand-wordmark"><span className="brand-symbol" aria-hidden="true">DC<span>.</span></span><span>dark<span className="font-normal">charts</span></span></Link>
      <nav className="hidden md:flex items-center gap-6" aria-label={t('a11y.nav')}>{links}</nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Link href="/voting" className="vote-header-link">{t('nav.voting')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        <Link href={user ? '/profile' : '/login?redirect=/profile'} className="hidden lg:inline-flex site-nav-link">{t(user ? 'nav.profile' : 'ui.login')}</Link>
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button className="md:hidden" variant="ghost" size="icon" aria-label={t('ui.menu')}><List size={24} /></Button></SheetTrigger><SheetContent className="bg-card"><SheetTitle>Dark Charts</SheetTitle><nav aria-label={t('a11y.nav')} className="flex flex-col gap-4 py-8">{links}<LanguageSwitcher /><Link href="/methodology" onClick={() => setOpen(false)}>{t('footer.methodology')}</Link><Link href="/profile" onClick={() => setOpen(false)}>{t('nav.profile')}</Link></nav></SheetContent></Sheet>
      </div>
    </div>
  </header>;
}
