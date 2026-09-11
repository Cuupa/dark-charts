'use client';

import Link from 'next/link';
import { Track } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { CaretUp, CaretDown, TrendUp, TrendDown, ArrowUp, ArrowDown, Minus, PlusCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { AlbumArtwork } from './AlbumArtwork';
import { SpotifyEmbed } from './SpotifyEmbed';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ChartEntryProps {
  track: Track;
  index: number;
  onClick?: (track: Track) => void;
  animate?: boolean;
}

export function ChartEntry({ track, index, onClick, animate = false }: ChartEntryProps) {
  const { t } = useLanguage();
  const movementColor = track.movement && track.movement > 0 ? 'text-accent' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
  const glowColor = track.rank === 1 ? 'primary' : track.rank <= 3 ? 'accent' : 'primary';
  const communityPower = track.community_power ?? 0;
  const trendDirection = track.trend_direction;

  const getTrendIcon = () => {
    if (!trendDirection || trendDirection === 'stable') return <Minus className="w-4 h-4" />;
    if (trendDirection === 'new') return <PlusCircle weight="fill" className="w-4 h-4 text-accent" />;
    if (trendDirection === 'up') return <ArrowUp weight="bold" className="w-4 h-4 text-accent" />;
    return <ArrowDown weight="bold" className="w-4 h-4 text-primary" />;
  };
  
  return (
    <li
      className="relative flex flex-col gap-3 p-4 border-b border-border group overflow-hidden cursor-pointer hover:bg-primary/5 transition-colors"
      onClick={() => onClick?.(track)}
      role="button"
      tabIndex={0}
      aria-label={`${track.title} by ${track.artist}, rank ${track.rank}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(track);
        }
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start gap-3 md:gap-4 relative z-10">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="relative flex items-center gap-1 md:gap-2">
            {trendDirection && (
              <div className={`flex-shrink-0 ${trendDirection === 'up' ? 'text-accent' : trendDirection === 'down' ? 'text-primary' : trendDirection === 'new' ? 'text-accent' : 'text-muted-foreground'}`} aria-label={`Trend: ${trendDirection}`}>
                {getTrendIcon()}
              </div>
            )}
            {animate ? (
              <motion.div 
                key={`rank-${track.id}-${track.rank}`}
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`display-font text-2xl md:text-4xl leading-none font-semibold ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}
              >
                {String(track.rank).padStart(2, '0')}
              </motion.div>
            ) : (
              <div className={`display-font text-2xl md:text-4xl leading-none font-semibold snap-transition ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}>
                {String(track.rank).padStart(2, '0')}
              </div>
            )}
          </div>
          
          {track.movement !== undefined && track.movement !== 0 && (
            <div className={`flex flex-col items-center flex-shrink-0 ${movementColor}`}>
              {track.movement > 0 ? (
                <CaretUp weight="fill" className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <CaretDown weight="fill" className="w-4 h-4 md:w-5 md:h-5" />
              )}
              <span className="cyber-data-label text-[8px] md:text-[10px]">{Math.abs(track.movement)}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <AlbumArtwork
            src={track.albumArt}
            alt={`${track.artist} - ${track.title}`}
            artist={track.artist}
            title={track.title}
            size="medium"
            glowColor={glowColor}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <div className="data-font text-base md:text-xl font-bold text-foreground truncate">
              <Link
                href={`/release/${track.id}`}
                onClick={(event) => event.stopPropagation()}
                className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {track.title}
              </Link>
            </div>
            <div className="data-font text-sm md:text-base text-muted-foreground truncate mt-0.5">
              {track.artist}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <TrendUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="data-font text-[10px] text-muted-foreground uppercase">{t('chart.weeks')}</span>
                <span className="data-font text-sm font-bold text-foreground">{track.weeksInChart || 1}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="data-font text-[10px] text-muted-foreground uppercase">{t('chart.votes')}</span>
                <span className="data-font text-sm font-bold text-accent">{track.votes || 0}</span>
              </div>
            </div>
          </div>

          {communityPower > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-ui text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{t('chart.crowd')}</span>
                <span className="data-font text-xs font-bold text-accent">{communityPower}%</span>
              </div>
              <Progress value={communityPower} className="h-1.5 bg-secondary" aria-label={`${t('chart.crowd')}: ${communityPower}%`} />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {track.genres.slice(0, 3).map((genre, idx) => (
              <Badge 
                key={idx} 
                variant="outline"
                className="uppercase text-[8px] font-ui font-semibold tracking-[0.1em] border border-border text-foreground/70 hover:bg-primary/20 hover:border-primary/50 snap-transition px-1.5 py-0.5 truncate max-w-[120px]"
                title={genre}
              >
                {genre}
              </Badge>
            ))}
            {track.genres.length > 3 && (
              <Badge variant="outline" className="uppercase text-[8px] font-ui font-semibold border border-border px-1.5 py-0.5">
                +{track.genres.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 flex-shrink-0 min-w-[140px]">
          <div className="flex flex-col items-center gap-1">
            <TrendUp className="w-4 h-4 text-muted-foreground" />
            <span className="data-font text-xs text-muted-foreground">{t('chart.weeks')}</span>
            <span className="data-font text-base font-bold text-foreground">{track.weeksInChart || 1}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <span className="data-font text-xs text-muted-foreground">{t('chart.votes')}</span>
            <span className="data-font text-base font-bold text-accent">{track.votes || 0}</span>
          </div>
        </div>
      </div>

      <div className="pl-0 md:pl-28">
        <SpotifyEmbed 
          spotifyUri={track.spotifyUri} 
          artist={track.artist}
          title={track.title}
        />
      </div>
    </li>
  );
}
