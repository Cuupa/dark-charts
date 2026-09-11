'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { MainGenre } from '@/types';
import { PillarNavigation, type PillarView } from '@/components/PillarNavigation';
import { MainGenreNavigation, type GenreNavValue } from '@/components/MainGenreNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { chartListPath, genreFromQuery, slugToMainGenre } from '@/lib/routes';

function getActivePillar(pathname: string): PillarView {
  if (pathname === '/charts/fan') return 'fan';
  if (pathname === '/charts/club' || pathname === '/charts/expert') return 'club';
  if (pathname === '/charts/streaming') return 'streaming';
  return 'overview';
}

function getActiveMainGenre(pathname: string, genreQuery: string | null): MainGenre | 'overall' {
  const fromQuery = genreFromQuery(genreQuery);
  if (fromQuery) return fromQuery;
  const match = pathname.match(/^\/genre\/([^/]+)/);
  if (!match) return 'overall';
  return slugToMainGenre(match[1]) ?? 'overall';
}

export function ChartNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showChartNav =
    pathname === '/' || pathname.startsWith('/charts/') || pathname.startsWith('/genre/');

  if (!showChartNav) return null;

  const activePillar = getActivePillar(pathname);
  const activeGenre = getActiveMainGenre(pathname, searchParams.get('genre'));
  const genreFilter = activeGenre === 'overall' ? null : activeGenre;

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <ErrorBoundary level="component">
        <PillarNavigation
          activePillar={activePillar}
          linkMode
          onPillarChange={() => undefined}
          getPillarHref={(pillar) => chartListPath(pillar, genreFilter)}
          className="mb-0"
        />
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <MainGenreNavigation
          activeGenre={activeGenre}
          linkMode
          onGenreChange={() => undefined}
          getGenreHref={(genre: GenreNavValue) =>
            chartListPath(activePillar, genre === 'overall' ? null : genre)
          }
          className="mb-0"
        />
      </ErrorBoundary>
    </div>
  );
}
