'use client';

import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartRankedList } from '@/components/ChartRankedList';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES } from '@/lib/routes';
import { getIsoWeekYear } from '@/lib/week';
import type { MainGenre, Track } from '@/types';

interface HybridChartTableProps {
  tracks: Track[];
  isLoading?: boolean;
  onTrackClick?: (track: Track) => void;
  weightsLabel?: string;
  genre?: MainGenre | null;
}

export function HybridChartTable({
  tracks,
  isLoading,
  onTrackClick,
  weightsLabel,
  genre,
}: HybridChartTableProps) {
  const { t } = useLanguage();
  const { weekNumber, year } = getIsoWeekYear(new Date());
  const title = genre
    ? `${t('chart.hybridTitle')} · ${genre} — KW ${weekNumber}/${year}`
    : `${t('chart.hybridTitle')} — KW ${weekNumber}/${year}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="display-font text-2xl md:text-3xl leading-tight text-foreground">{title}</h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          {t('chart.whyThisWeekBody')}
        </p>
        {weightsLabel && <p className="text-sm text-muted-foreground">{weightsLabel}</p>}
        <Link href={ROUTES.methodology} className="inline-block text-sm text-primary hover:underline">
          {t('chart.methodologyLink')} →
        </Link>
      </div>

      <ErrorBoundary level="component">
        <ChartRankedList tracks={tracks} isLoading={isLoading} onTrackClick={onTrackClick} />
      </ErrorBoundary>
    </div>
  );
}
