'use client';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Play } from '@phosphor-icons/react';
import type { Track } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlbumArtwork } from '@/components/AlbumArtwork';
import { chartMetric } from '@/lib/charts/presentation';
import { cn } from '@/lib/utils';

interface ChartEntryProps { track: Track; index: number; onClick?: (track: Track) => void; animate?: boolean; }
export function ChartEntry({ track, onClick }: ChartEntryProps) {
  const { t, language } = useLanguage();
  const score = chartMetric(track);
  const movement = track.movement;
  const metric = track.chartType === 'fan' ? 'ui.fanScore' : track.chartType === 'expert' ? 'ui.clubScore' : track.chartType === 'streaming' ? 'ui.streamingScore' : 'ui.overallScore';
  return <li className={cn('chart-row', track.rank === 1 && 'chart-row-first')}>
    <div className="chart-rank" aria-label={`${t('ui.rank')} ${track.rank}`}>{String(track.rank).padStart(2, '0')}</div>
    <div className={cn('chart-movement', typeof movement === 'number' && movement > 0 && 'is-up', typeof movement === 'number' && movement < 0 && 'is-down')} aria-label={`${t('ui.movement')}: ${track.trend_direction === 'new' ? t('ui.new') : movement ?? t('ui.unknown')}`}>
      {track.trend_direction === 'new' ? <span className="new-label">{t('ui.new')}</span> : typeof movement !== 'number' ? <span aria-hidden="true">-</span> : movement === 0 ? <Minus size={14} aria-hidden="true" /> : <>{movement > 0 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}<span>{Math.abs(movement)}</span></>}
    </div>
    <Link href={`/release/${encodeURIComponent(track.id)}`} className="chart-artwork-link" tabIndex={-1} aria-hidden="true"><AlbumArtwork src={track.albumArt} alt="" artist={track.artist} title={track.title} size="small" /></Link>
    <div className="chart-track">
      <Link className="chart-title" href={`/release/${encodeURIComponent(track.id)}`}>{track.title || t('chart.unknownTitle')}</Link>
      {track.artistId ? <Link className="chart-artist" href={`/artist/${encodeURIComponent(track.artistId)}`}>{track.artist || t('chart.unknownArtist')}</Link> : <span className="chart-artist">{track.artist || t('chart.unknownArtist')}</span>}
      <span className="chart-genre">{track.genres[0]}</span>
    </div>
    <div className="chart-weeks"><span>{t('chart.weeks')}</span><strong>{track.weeksInChart ?? '-'}</strong></div>
    <div className="chart-score"><span>{t(metric)}</span><strong>{score === null ? '-' : score.toLocaleString(language, { maximumFractionDigits: 1 })}</strong></div>
    {onClick ? <button className="chart-play" onClick={() => onClick(track)} aria-label={`${t('ui.listen')}: ${track.title}`}><Play size={18} weight="fill" aria-hidden="true" /></button> : <Link className="chart-play" href={`/release/${encodeURIComponent(track.id)}`} aria-label={`${t('ui.details')}: ${track.title}`}><ArrowUp size={18} className="rotate-45" aria-hidden="true" /></Link>}
  </li>;
}
