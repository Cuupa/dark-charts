'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Genre, MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';
import { ChartHeader } from '@/components/charts/ChartHeader';
import { HybridChartTable } from '@/components/HybridChartTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChartNavigation } from './ChartNavigation';
import { useChartShell } from './ChartShellClient';

export function GenrePageClient(props: { mainGenre: MainGenre; subGenre?: Genre | null }) {
  return (
    <Suspense fallback={null}>
      <GenrePageInner {...props} />
    </Suspense>
  );
}

function GenrePageInner({ mainGenre, subGenre = null }: { mainGenre: MainGenre; subGenre?: Genre | null }) {
  const shell = useChartShell();
  const mode = useSearchParams().get('pillar') ?? 'overall';
  const { t } = useLanguage();
  const base = mode === 'fan' ? shell.fanCharts : mode === 'club' || mode === 'expert' ? shell.expertCharts : mode === 'streaming' ? [] : shell.overallChart;
  const tracks = base.filter(track => track.genres.some(g => subGenre ? g === subGenre : mainGenreMap[mainGenre].includes(g))).map((track, i) => ({ ...track, rank: i + 1 }));
  return <><ChartHeader title={subGenre ?? mainGenre} lead={t(`pillar.${mode === 'expert' ? 'club' : mode}`)} edition={shell.edition} /><ChartNavigation /><HybridChartTable tracks={tracks} isLoading={shell.isLoading} error={!!shell.error} onRetry={shell.reload} onTrackClick={track => shell.playTrack(track, tracks)} /></>;
}
