'use client';
import { ChartEntry } from '@/components/ChartEntry';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ChartState } from '@/components/charts/ChartState';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Track } from '@/types';
interface HybridChartTableProps { tracks: Track[]; isLoading?: boolean; onTrackClick?: (track: Track) => void; weightsLabel?: string; error?: boolean; onRetry?: () => void; }
export function HybridChartTable({ tracks, isLoading, onTrackClick, weightsLabel, error, onRetry }: HybridChartTableProps) {
  const { t } = useLanguage();
  return <section className="chart-table" aria-label={t('nav.home')} aria-busy={isLoading}>
    <div className="chart-table-top"><span>{t('ui.results', { count: tracks.length })}</span>{weightsLabel && <span>{weightsLabel}</span>}</div>
    <div className="chart-columns" aria-hidden="true"><span>{t('ui.rank')}</span><span /><span /><span>{t('ui.release')}</span><span>{t('chart.weeks')}</span><span>{t('ui.score')}</span><span /></div>
    {isLoading ? <div>{Array.from({ length: 6 }, (_, i) => <ChartEntrySkeleton key={i} index={i} />)}</div> : error ? <ChartState error onRetry={onRetry} /> : tracks.length === 0 ? <ChartState /> : <ol className="m-0 list-none p-0">{tracks.map((track, i) => <ChartEntry key={track.id} track={track} index={i} onClick={onTrackClick} />)}</ol>}
  </section>;
}
