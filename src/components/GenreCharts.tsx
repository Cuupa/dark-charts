import { useState, useMemo, useCallback, useEffect } from 'react';
import { MainGenre, Genre, Track, ChartType } from '@/types';
import { Card } from '@/components/ui/card';
import { ChartEntry } from '@/components/ChartEntry';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Funnel, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface GenreChartsProps {
  mainGenre: MainGenre;
  activePillar: ChartType | 'overview';
  fanCharts: Track[];
  expertCharts: Track[];
  isLoading: boolean;
  onTrackClick: (track: Track) => void;
}

const subGenresByMainGenre: Record<MainGenre, Genre[]> = {
  'Gothic': [
    'Gothic Rock', 'Dark Wave', 'Post Punk', 'Deathrock', 'Cold Wave',
    'Ethereal Wave', 'Neoklassik', 'Neue Deutsche Todeskunst', 'Batcave',
    'Neofolk', 'Pagan Folk', 'Nordic Folk', 'Ritual Ambient'
  ],
  'Metal': [
    'Gothic Metal', 'Dark Metal', 'Symphonic Metal', 'Doom Metal',
    'Symphonic Black Metal', 'Atmospheric Black Metal', 'Death Doom', 'Pagan Metal'
  ],
  'Dark Electro': [
    'Electronic Body Music', 'Dark Electro', 'Electro Industrial', 'Aggrotech',
    'Future Pop', 'Industrial', 'Rhythmic Noise', 'Dark Synthpop', 'Harsh EBM'
  ],
  'Crossover': [
    'Industrial Metal', 'Neue Deutsche Härte', 'Mittelalter Rock', 'Darksynth',
    'Cybergoth', 'Death Industrial', 'Folk Metal', 'Dark Techno',
    'Industrial Techno', 'Darkstep', 'Crossbreed', 'Techstep', 'Neurofunk'
  ]
};

export function GenreCharts({ 
  mainGenre, 
  activePillar,
  fanCharts, 
  expertCharts, 
  isLoading,
  onTrackClick 
}: GenreChartsProps) {
  const [selectedSubGenre, setSelectedSubGenre] = useState<Genre | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const subGenres = subGenresByMainGenre[mainGenre];

  useEffect(() => {
    setSelectedSubGenre(null);
  }, [mainGenre]);

  const handleSubGenreSelect = (genre: Genre | null) => {
    setSelectedSubGenre(genre);
    if (isMobile) {
      setIsFilterSheetOpen(false);
    }
  };

  const filterByMainGenre = useCallback((tracks: Track[]): Track[] => {
    return tracks.filter(track => {
      return track.genres.some(genre => subGenres.includes(genre));
    });
  }, [subGenres]);

  const filterBySubGenre = useCallback((tracks: Track[]): Track[] => {
    if (!selectedSubGenre) return tracks;
    return tracks.filter(track => track.genres.includes(selectedSubGenre));
  }, [selectedSubGenre]);

  const getFilteredCharts = useCallback((tracks: Track[]) => {
    const mainGenreTracks = filterByMainGenre(tracks);
    const filtered = filterBySubGenre(mainGenreTracks);
    return filtered.slice(0, 20);
  }, [filterByMainGenre, filterBySubGenre]);

  const filteredFanCharts = useMemo(() => getFilteredCharts(fanCharts), [fanCharts, getFilteredCharts]);
  const filteredExpertCharts = useMemo(() => getFilteredCharts(expertCharts), [expertCharts, getFilteredCharts]);

  const filteredOverallCharts = useMemo(() => {
    const allTracks = [...fanCharts, ...expertCharts];
    const mainGenreTracks = filterByMainGenre(allTracks);
    const filtered = filterBySubGenre(mainGenreTracks);

    const uniqueTracksMap = new Map<string, Track>();
    filtered.forEach((track) => {
      if (!uniqueTracksMap.has(track.id)) {
        uniqueTracksMap.set(track.id, track);
      }
    });

    const uniqueTracks = Array.from(uniqueTracksMap.values());
    uniqueTracks.sort((a, b) => {
      const scoreA = (a.fanScore || 0) + (a.expertScore || 0);
      const scoreB = (b.fanScore || 0) + (b.expertScore || 0);
      return scoreB - scoreA;
    });

    return uniqueTracks.slice(0, 20);
  }, [fanCharts, expertCharts, filterByMainGenre, filterBySubGenre]);

  const currentChartTracks = useMemo(() => {
    if (activePillar === 'overview') return filteredOverallCharts;
    if (activePillar === 'fan') return filteredFanCharts;
    if (activePillar === 'expert') return filteredExpertCharts;
    return filteredOverallCharts;
  }, [activePillar, filteredOverallCharts, filteredFanCharts, filteredExpertCharts]);

  const chartTypeLabel = useMemo(() => {
    if (activePillar === 'overview') return 'Overall';
    if (activePillar === 'fan') return 'Fan';
    if (activePillar === 'expert') return 'Club';
    return 'Overall';
  }, [activePillar]);

  const renderChartSection = (tracks: Track[]) => {
    if (isLoading) {
      return (
        <Card className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {mainGenre} {chartTypeLabel} Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
            </h2>
          </div>
          <div>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
              <ChartEntrySkeleton key={index} index={index} />
            ))}
          </div>
        </Card>
      );
    }

    if (tracks.length === 0) {
      return (
        <Card className="bg-card border border-border p-12 text-center">
          <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
            No tracks found for this selection
          </p>
        </Card>
      );
    }

    return (
      <Card className="bg-card border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
            {mainGenre} {chartTypeLabel} Charts{selectedSubGenre && ` • ${selectedSubGenre}`}
          </h2>
        </div>
        <motion.div layout>
          <AnimatePresence mode="popLayout">
            {tracks.map((track, index) => (
              <motion.div 
                key={track.id}
                layoutId={`track-${track.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.15 }
                }}
                onClick={() => onTrackClick(track)} 
                className="cursor-pointer"
              >
                <ChartEntry track={{ ...track, rank: index + 1 }} index={index} animate={true} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-4 mb-6">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          {mainGenre} Charts
        </h1>
        
        {isMobile ? (
          <div>
            <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold block mb-3">
              Filter by Subgenre
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                  onClick={() => handleSubGenreSelect(null)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition whitespace-nowrap",
                    !selectedSubGenre 
                      ? 'bg-accent border-accent text-accent-foreground' 
                      : 'bg-card border-border text-foreground hover:bg-accent/20'
                  )}
                >
                  All
                </button>
                {subGenres.slice(0, 3).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleSubGenreSelect(genre)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition whitespace-nowrap",
                      selectedSubGenre === genre 
                        ? 'bg-accent border-accent text-accent-foreground' 
                        : 'bg-card border-border text-foreground hover:bg-accent/20'
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <button className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card border border-border hover:bg-accent/20 snap-transition">
                    <Funnel weight="bold" className="w-5 h-5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-background border-t border-border">
                  <SheetHeader className="border-b border-border pb-4 mb-4">
                    <SheetTitle className="font-ui text-lg uppercase tracking-[0.15em] font-bold text-foreground">
                      {mainGenre} Subgenres
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 overflow-y-auto h-[calc(80vh-100px)]">
                    <button
                      onClick={() => handleSubGenreSelect(null)}
                      className={cn(
                        "w-full px-6 py-4 text-left font-ui text-sm uppercase tracking-[0.1em] font-semibold snap-transition border",
                        !selectedSubGenre
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-card text-muted-foreground border-border hover:bg-accent/20"
                      )}
                    >
                      All Subgenres
                    </button>
                    {subGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleSubGenreSelect(genre)}
                        className={cn(
                          "w-full px-6 py-4 text-left font-ui text-sm uppercase tracking-[0.1em] font-semibold snap-transition border",
                          selectedSubGenre === genre
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-card text-muted-foreground border-border hover:bg-accent/20"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              Filter by Subgenre
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubGenre(null)}
                className={cn(
                  "px-3 py-1.5 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition",
                  !selectedSubGenre 
                    ? 'bg-accent border-accent text-accent-foreground' 
                    : 'bg-card border-border hover:bg-accent/20'
                )}
              >
                All
              </button>
              {subGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedSubGenre(genre)}
                  className={cn(
                    "px-3 py-1.5 border font-ui text-[10px] uppercase tracking-[0.15em] font-semibold snap-transition",
                    selectedSubGenre === genre 
                      ? 'bg-accent border-accent text-accent-foreground' 
                      : 'bg-card border-border hover:bg-accent/20'
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderChartSection(currentChartTracks)}
      </div>
    </div>
  );
}
