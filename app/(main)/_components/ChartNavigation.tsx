'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MainGenre } from '@/types';
import { PillarNavigation, type PillarView } from '@/components/PillarNavigation';
import { MainGenreNavigation } from '@/components/MainGenreNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ROUTES,
  mainGenrePath,
  pillarChartPath,
  slugToMainGenre,
} from '@/lib/routes';

function getActivePillar(pathname: string): PillarView {
  if (pathname === '/charts/fan') return 'fan';
  if (pathname === '/charts/club' || pathname === '/charts/expert') return 'club';
  if (pathname === '/charts/streaming') return 'streaming';
  return 'overview';
}

function getActiveMainGenre(pathname: string): MainGenre | 'overall' {
  const match = pathname.match(/^\/genre\/([^/]+)/);
  if (!match) return 'overall';
  return slugToMainGenre(match[1]) ?? 'overall';
}

export function ChartNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const showChartNav =
    pathname === ROUTES.home ||
    pathname.startsWith('/charts/') ||
    pathname.startsWith('/genre/');

  if (!showChartNav) return null;

  const activePillar = getActivePillar(pathname);
  const activeGenre = getActiveMainGenre(pathname);

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <ErrorBoundary level="component">
        <PillarNavigation
          activePillar={activePillar}
          linkMode
          onPillarChange={(pillar) => {
            if (pillar === 'overview') {
              router.push(ROUTES.home);
            } else {
              router.push(pillarChartPath(pillar));
            }
          }}
          getPillarHref={(pillar) =>
            pillar === 'overview' ? ROUTES.home : pillarChartPath(pillar)
          }
          className="mb-0"
        />
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <MainGenreNavigation
          activeGenre={activeGenre}
          linkMode
          onGenreChange={(genre) => {
            router.push(mainGenrePath(genre));
          }}
          getGenreHref={(genre) => mainGenrePath(genre)}
          className="mb-0"
        />
      </ErrorBoundary>
    </div>
  );
}
