import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ChartLine, Info, Sliders, List, X, ChartBar, ClockCounterClockwise, Translate, Users } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ViewType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, ROUTES } from '@/lib/routes';

interface NavigationProps {
  currentView?: ViewType;
  onNavigate?: (view: ViewType) => void;
  linkMode?: boolean;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation({ currentView, onNavigate, linkMode = false }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  const isActive = (view: ViewType, href: string) =>
    linkMode ? isNavActive(pathname, href) : currentView === view;

  const NavContent = () => (
    <>
      <button
        onClick={() => {
          onNavigate?.('home');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'home' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-primary/20'}`}
        aria-label={t('nav.home')}
        aria-current={currentView === 'home' ? 'page' : undefined}
      >
        <ChartLine weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.home')}
      </button>

      <button
        onClick={() => {
          onNavigate?.('custom-charts');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'custom-charts' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={t('nav.custom')}
        aria-current={currentView === 'custom-charts' ? 'page' : undefined}
      >
        <Sliders weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.custom')}
      </button>

      <button
        onClick={() => {
          onNavigate?.('voting');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'voting' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={t('nav.voting')}
        aria-current={currentView === 'voting' ? 'page' : undefined}
      >
        <ChartBar weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.voting')}
      </button>

      <button
        onClick={() => {
          onNavigate?.('history');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'history' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={t('nav.history')}
        aria-current={currentView === 'history' ? 'page' : undefined}
      >
        <ClockCounterClockwise weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.history')}
      </button>

      <button
        onClick={() => {
          onNavigate?.('profile');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'profile' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={t('nav.profile')}
        aria-current={currentView === 'profile' ? 'page' : undefined}
      >
        <User weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.profile')}
      </button>

      <button
        onClick={() => {
          onNavigate?.('profiles-demo');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'profiles-demo' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label="Navigate to Profiles Demo"
        aria-current={currentView === 'profiles-demo' ? 'page' : undefined}
      >
        <Users weight="bold" className="w-5 h-5" aria-hidden="true" />
        Profiles Demo
      </button>

      <button
        onClick={() => {
          onNavigate?.('about');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'about' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={t('nav.about')}
        aria-current={currentView === 'about' ? 'page' : undefined}
      >
        <Info weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.about')}
      </button>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <Translate weight="bold" className="w-4 h-4" aria-hidden="true" />
          <span className="font-ui text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
            {t('profile.language')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Language selection">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="font-ui text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Switch to English"
            aria-pressed={language === 'en'}
          >
            EN
          </Button>
          <Button
            variant={language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('de')}
            className="font-ui text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Switch to German"
            aria-pressed={language === 'de'}
          >
            DE
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <button 
          className="fixed top-4 left-4 z-50 p-3 bg-card border border-border hover:bg-primary snap-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <List weight="bold" className="w-6 h-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-card border-r border-border flex flex-col" aria-label="Main navigation">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-ui text-sm uppercase tracking-[0.15em] font-bold">{t('nav.home')}</span>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-primary/20 snap-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close navigation menu"
          >
            <X weight="bold" className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 flex flex-col overflow-y-auto" aria-label="Primary navigation">
          <NavContent />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
