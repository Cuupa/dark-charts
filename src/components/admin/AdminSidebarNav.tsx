'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  SquaresFour,
  Microphone,
  VinylRecord,
  ChartLine,
  ShieldWarning,
  HandPointing,
  UsersThree,
  Megaphone,
  ChartLineUp,
  Medal,
  Gear,
  ToggleRight,
  Palette,
  Key,
  Cpu,
  SignOut,
  List,
  Broadcast,
  type Icon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_DASHBOARD_HREF, ADMIN_NAV_GROUPS } from '@/lib/admin/nav';
import { ROUTES } from '@/lib/routes';

const ICONS: Record<string, Icon> = {
  Artists: Microphone,
  Releases: VinylRecord,
  'Chart Control': ChartLine,
  Anomalies: ShieldWarning,
  Votes: HandPointing,
  'Radio Monitor': Broadcast,
  Users: UsersThree,
  Spotlight: Megaphone,
  Analytics: ChartLineUp,
  Badges: Medal,
  Settings: Gear,
  Features: ToggleRight,
  Colors: Palette,
  'API Keys': Key,
  System: Cpu,
};

const DASHBOARD_ITEM = { label: 'Dashboard', href: ADMIN_DASHBOARD_HREF };

function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.admin) return pathname === ROUTES.admin;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      toast.success('Signed out');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  }, [logout, router]);

  const renderNavItem = (label: string, href: string, onNavigate?: () => void) => {
    const IconComponent = ICONS[label] ?? SquaresFour;
    const active = isActive(pathname, href);

    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-current={active ? 'page' : undefined}
        >
          <IconComponent size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
          {label}
        </Link>
      </li>
    );
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav
      className="flex-1 overflow-y-auto py-3 px-2"
      style={{ overscrollBehavior: 'contain' }}
      data-lenis-prevent
      aria-label="Admin sections"
    >
      <ul className="space-y-0.5 mb-2">
        {renderNavItem(DASHBOARD_ITEM.label, DASHBOARD_ITEM.href, onNavigate)}
      </ul>

      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 pt-4 pb-1">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => renderNavItem(item.label, item.href, onNavigate))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const renderFooter = () => (
    <div className="border-t border-border px-3 py-3 space-y-2">
      <p className="text-xs text-muted-foreground truncate px-1">{user?.email}</p>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <SignOut size={16} weight="bold" aria-hidden="true" />
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <p className="text-sm font-bold tracking-wide">Dark Charts Admin</p>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open admin navigation" className="min-h-[44px] min-w-[44px]">
              <List size={20} aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="flex h-full flex-col bg-card">
              <div className="px-4 py-5 border-b border-border">
                <p className="text-sm font-bold tracking-wide">Dark Charts Admin</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role?.toLowerCase() ?? 'admin'}</p>
              </div>
              {renderNavLinks(() => setMobileOpen(false))}
              {renderFooter()}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <aside
        className="hidden md:flex flex-col h-full w-56 shrink-0 border-r border-border bg-card"
        aria-label="Admin navigation"
      >
        <div className="px-4 py-5 border-b border-border">
          <p className="text-sm font-bold tracking-wide">Dark Charts Admin</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role?.toLowerCase() ?? 'admin'}</p>
        </div>
        {renderNavLinks()}
        {renderFooter()}
      </aside>
    </>
  );
}