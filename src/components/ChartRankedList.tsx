'use client';

import { ChartEntry } from '@/components/ChartEntry';
import { ChartPodium } from '@/components/ChartPodium';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Track } from '@/types';

interface ChartRankedListProps {
  tracks: Track[];
  isLoading?: boolean;
  onTrackClick?: (track: Track) => void;
}

export function ChartRankedList({ tracks, isLoading, onTrackClick }: ChartRankedListProps) {
  const { t } = useLanguage();
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 10 }).map((_, index) => (
          <ChartEntrySkeleton key={index} index={index} />
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground border border-border bg-card">{t('chart.emptyGenre')}</p>
    );
  }

  const rest = tracks.slice(3);

  return (
    <div className="space-y-6">
      <ChartPodium tracks={tracks} onTrackClick={onTrackClick} />
      {rest.length > 0 && (
        <ul className="list-none p-0 m-0 bg-card border border-border">
          {rest.map((track, index) => (
            <ChartEntry
              key={track.id}
              track={track}
              index={index + 3}
              onClick={onTrackClick}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
