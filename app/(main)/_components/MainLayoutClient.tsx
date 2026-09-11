'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DataSourceBanner } from '@/components/DataSourceBanner';
import { PromotionalSlot } from '@/components/PromotionalSlot';
import { ChartNavigation } from './ChartNavigation';
import { useChartShell } from './ChartShellClient';

interface MainLayoutClientProps {
  children: ReactNode;
}

function shouldShowSpotlight(pathname: string): boolean {
  if (pathname.startsWith('/voting')) return false;
  if (pathname.startsWith('/profile')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/oauth')) return false;
  return true;
}

export function MainLayoutClient({ children }: MainLayoutClientProps) {
  const pathname = usePathname();
  const { activePromotion } = useChartShell();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pt-16">
      <ErrorBoundary level="component">
        <ChartNavigation />
      </ErrorBoundary>

      <main id="main-content" className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 md:px-8 pb-28">
        <DataSourceBanner />
        {activePromotion && shouldShowSpotlight(pathname) && (
          <div className="mb-8">
            <PromotionalSlot
              type={activePromotion.type}
              name={activePromotion.name}
              imageUrl={activePromotion.imageUrl}
            />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
