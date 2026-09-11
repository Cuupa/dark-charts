'use client';
import Link from 'next/link';
import type { Track, MainGenre, Genre, ChartType } from '@/types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlbumArtwork } from './AlbumArtwork';
import { useLanguage } from '@/contexts/LanguageContext';
interface ChartPosition { chartName: string; position: number; chartType?: ChartType; mainGenre?: MainGenre; subGenre?: Genre; }
interface TrackDetailModalProps { track: Track | null; isOpen: boolean; onClose: () => void; onVote?: (id: string, direction: 'up' | 'down') => void; userVote?: 'up' | 'down' | null; allChartPositions?: ChartPosition[]; onNavigateToChart?: (type?: ChartType, genre?: MainGenre, sub?: Genre) => void; }
export function TrackDetailModal({ track, isOpen, onClose, allChartPositions = [], onNavigateToChart }: TrackDetailModalProps) {
  const { t } = useLanguage();
  if (!track) return null;
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-w-xl"><AlbumArtwork src={track.albumArt} alt="" artist={track.artist} title={track.title} size="large" /><DialogTitle>{track.title}</DialogTitle><DialogDescription>{track.artist} / {track.genres.join(', ')}</DialogDescription><div className="flex flex-wrap gap-3">{allChartPositions.map((p, i) => <button key={i} className="text-link" onClick={() => { onClose(); onNavigateToChart?.(p.chartType, p.mainGenre, p.subGenre); }}>{p.chartName}: #{p.position}</button>)}</div><Link className="text-link" onClick={onClose} href={`/release/${encodeURIComponent(track.id)}`}>{t('ui.details')}</Link></DialogContent></Dialog>;
}
