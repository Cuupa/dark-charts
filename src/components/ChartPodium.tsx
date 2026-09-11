'use client';

import Link from 'next/link';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { AlbumArtwork } from '@/components/AlbumArtwork';
import { cn } from '@/lib/utils';
import type { Track } from '@/types';

interface ChartPodiumProps {
  tracks: Track[];
  onTrackClick?: (track: Track) => void;
}

export function ChartPodium({ tracks, onTrackClick }: ChartPodiumProps) {
  const top = tracks.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none p-0 m-0">
      {top.map((track) => {
        const isFirst = track.rank === 1;
        return (
          <li key={track.id}>
            <button
              type="button"
              onClick={() => onTrackClick?.(track)}
              className={cn(
                'w-full text-left bg-card border p-4 min-h-[44px] transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isFirst ? 'border-primary shadow-[0_0_32px_color-mix(in_oklch,var(--primary)_35%,transparent)]' : 'border-border'
              )}
            >
              <div className="flex md:flex-col items-center gap-4">
                <span
                  className={cn(
                    'display-font leading-none',
                    isFirst ? 'text-4xl text-primary' : 'text-3xl text-foreground/80'
                  )}
                >
                  {String(track.rank).padStart(2, '0')}
                </span>
                <AlbumArtwork
                  src={track.albumArt}
                  alt={`${track.artist} - ${track.title}`}
                  artist={track.artist}
                  title={track.title}
                  size="podium"
                  glowColor={isFirst ? 'primary' : 'accent'}
                />
                <div className="min-w-0 flex-1 md:text-center">
                  <Link
                    href={`/release/${track.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="data-font font-bold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {track.title}
                  </Link>
                  <p className="data-font text-sm text-muted-foreground truncate mt-1">{track.artist}</p>
                  {track.movement !== undefined && track.movement !== 0 && (
                    <p
                      className={cn(
                        'mt-2 inline-flex items-center gap-0.5 text-xs',
                        track.movement > 0 ? 'text-accent' : 'text-primary'
                      )}
                    >
                      {track.movement > 0 ? <CaretUp weight="fill" /> : <CaretDown weight="fill" />}
                      {Math.abs(track.movement)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
