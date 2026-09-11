'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { slugToMainGenre, slugToSubGenre } from '@/lib/routes';
import { mainGenreMap } from '@/lib/config/genres';
import { chartFilterHref } from '@/lib/charts/presentation';
import type { Genre, MainGenre } from '@/types';
import { cn } from '@/lib/utils';

export function ChartNavigation() {
  return (
    <Suspense fallback={null}>
      <ChartNavigationInner />
    </Suspense>
  );
}

function ChartNavigationInner() {
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  if (!(path === '/' || path.startsWith('/charts/') || path.startsWith('/genre/')) || path.includes('archive')) return null;
  const parts = path.split('/');
  const genre = parts[1] === 'genre' ? slugToMainGenre(parts[2]) : null;
  const sub = genre && parts[3] ? slugToSubGenre(parts[3], genre) : null;
  const mode = parts[1] === 'charts' ? parts[2] ?? 'overall' : search.get('pillar') ?? 'overall';
  return <div className="chart-controls">
    <nav className="chart-tabs" aria-label={t('nav.home')}>{['overall', 'fan', 'club', 'streaming'].map(p => <Link key={p} href={chartFilterHref(p as 'overall' | 'fan' | 'club' | 'streaming', genre, sub)} className={cn('chart-tab', p === mode && 'is-active', p === 'streaming' && 'streaming-tab')} aria-current={p === mode ? 'page' : undefined}>{t(`pillar.${p}`)}</Link>)}</nav>
    <div className="chart-filter-row">
      <label><span>{t('ui.genre')}</span><select value={genre ?? ''} onChange={e => router.push(chartFilterHref(mode as 'overall' | 'fan' | 'club' | 'streaming', (e.target.value || null) as MainGenre | null, null))}><option value="">{t('ui.allGenres')}</option>{Object.keys(mainGenreMap).map(g => <option key={g}>{g}</option>)}</select></label>
      {genre && <label><span>{t('ui.subgenre')}</span><select value={sub ?? ''} onChange={e => router.push(chartFilterHref(mode as 'overall' | 'fan' | 'club' | 'streaming', genre, (e.target.value || null) as Genre | null))}><option value="">{t('ui.allSubgenres')}</option>{mainGenreMap[genre].map(g => <option key={g}>{g}</option>)}</select></label>}
      {genre && <Link className="filter-reset" href={chartFilterHref(mode as 'overall' | 'fan' | 'club' | 'streaming', null, null)}>{t('ui.clear')}</Link>}
    </div>
  </div>;
}
