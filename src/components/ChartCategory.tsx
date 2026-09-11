import { Track } from '@/types';
import { AlbumArtwork } from './AlbumArtwork';
import { Badge } from '@/components/ui/badge';
import { CaretUp, CaretDown, TrendUp, ArrowUp, ArrowDown, Minus, PlusCircle } from '@phosphor-icons/react';
import { ChartCategorySkeleton } from './skeletons';

interface ChartCategoryProps {
  title: string;
  tracks: Track[];
  isLoading?: boolean;
  onTrackClick?: (track: Track) => void;
}

export function ChartCategory({ title, tracks, isLoading, onTrackClick }: ChartCategoryProps) {
  const topThree = tracks.slice(0, 3);

  if (isLoading) {
    return <ChartCategorySkeleton title={title} />;
  }

  const getTrendIcon = (trendDirection?: 'up' | 'down' | 'stable' | 'new') => {
    if (!trendDirection || trendDirection === 'stable') return <Minus className="w-3 h-3" />;
    if (trendDirection === 'new') return <PlusCircle weight="fill" className="w-3 h-3 text-accent" />;
    if (trendDirection === 'up') return <ArrowUp weight="bold" className="w-3 h-3 text-accent" />;
    return <ArrowDown weight="bold" className="w-3 h-3 text-primary" />;
  };

  return (
    <section className="bg-card border border-border overflow-hidden relative" aria-labelledby={`chart-title-${title.replace(/\s+/g, '-')}`}>
      <div className="p-4 border-b border-border relative z-10">
        <h2 id={`chart-title-${title.replace(/\s+/g, '-')}`} className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">{title}</h2>
      </div>
      <ul className="relative z-10 space-y-2 p-4" role="list">
        {topThree.map((track, index) => {
          const movementColor = track.movement && track.movement > 0 ? 'text-accent' : track.movement && track.movement < 0 ? 'text-primary' : 'text-muted-foreground';
          const glowColor = track.rank === 1 ? 'primary' : track.rank <= 3 ? 'accent' : 'primary';
          const trendDirection = track.trend_direction;
          
          return (
            <li
              key={track.id}
              className="relative flex items-start gap-3 p-3 cursor-pointer group border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => onTrackClick?.(track)}
              role="button"
              tabIndex={0}
              aria-label={`${track.title} by ${track.artist}, rank ${track.rank}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTrackClick?.(track);
                }
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                {trendDirection && (
                  <div className={`flex-shrink-0 ${trendDirection === 'up' ? 'text-accent' : trendDirection === 'down' ? 'text-primary' : trendDirection === 'new' ? 'text-accent' : 'text-muted-foreground'}`} aria-label={`Trend: ${trendDirection}`}>
                    {getTrendIcon(trendDirection)}
                  </div>
                )}
                <div className={`display-font text-2xl md:text-3xl leading-none font-semibold snap-transition ${track.rank === 1 ? 'text-primary' : track.rank <= 3 ? 'text-accent' : 'text-foreground/80'}`}>
                  {String(track.rank).padStart(2, '0')}
                </div>
                
                {track.movement !== undefined && track.movement !== 0 && (
                  <div className={`flex flex-col items-center flex-shrink-0 ${movementColor}`}>
                    {track.movement > 0 ? (
                      <CaretUp weight="fill" className="w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <CaretDown weight="fill" className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                    <span className="text-[8px] font-bold">{Math.abs(track.movement)}</span>
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

              <div className="flex-1 min-w-0 flex flex-col gap-2 relative z-10">
                <div>
                  <div className="cyber-hover-chromatic data-font text-base md:text-lg font-bold text-foreground truncate">
                    {track.title}
                  </div>
                  <div className="data-font text-sm text-muted-foreground truncate mt-1">
                    {track.artist}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <TrendUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="data-font text-[9px] text-muted-foreground uppercase">W</span>
                      <span className="data-font text-sm font-bold text-foreground">{track.weeksInChart || 1}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="data-font text-[9px] text-muted-foreground uppercase">Votes</span>
                      <span className="data-font text-sm font-bold text-accent">{track.votes || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {track.genres.slice(0, 2).map((genre, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="uppercase text-[8px] font-ui font-semibold tracking-[0.1em] border border-border text-foreground/70 hover:bg-primary/20 hover:border-primary/50 snap-transition px-1.5 py-0.5 truncate max-w-[100px]"
                      title={genre}
                    >
                      {genre}
                    </Badge>
                  ))}
                  {track.genres.length > 2 && (
                    <Badge variant="outline" className="uppercase text-[8px] font-ui font-semibold border border-border px-1.5 py-0.5">
                      +{track.genres.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0 min-w-[100px] relative z-10">
                <div className="flex flex-col items-center gap-0.5">
                  <TrendUp className="w-3 h-3 text-muted-foreground" />
                  <span className="data-font text-[9px] text-muted-foreground uppercase">W</span>
                  <span className="data-font text-sm font-bold text-foreground">{track.weeksInChart || 1}</span>
                </div>
                
                <div className="flex flex-col items-center gap-0.5">
                  <span className="data-font text-[9px] text-muted-foreground uppercase">Votes</span>
                  <span className="data-font text-sm font-bold text-accent">{track.votes || 0}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
