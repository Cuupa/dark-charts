import { logger } from "@/lib/logger";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Track, Genre } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlass, Lightning, Coins, Calendar } from '@phosphor-icons/react';
import { useKV } from '@/hooks/useKV';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { VotingAreaSkeleton } from '@/components/skeletons';
import { AlbumArtwork } from './AlbumArtwork';
import { getNextMonday } from '@/lib/week';

interface VotingAreaProps {
  allTracks: Track[];
  onTrackClick: (track: Track) => void;
}

function calculateQuadraticCost(credits: number): number {
  return credits * credits;
}

export function FanVotingArea({ allTracks, onTrackClick, onVoteComplete }: VotingAreaProps & { onVoteComplete?: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  const [allocatedVotes, setAllocatedVotes] = useState<Record<string, number>>({});
  const [nextPublishDate] = useState<Date>(getNextMonday());
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [creditBudget, setCreditBudget] = useState(150);
  const [serverRemainingCredits, setServerRemainingCredits] = useState(150);
  const [blockedReleaseIds, setBlockedReleaseIds] = useState<Set<string>>(new Set());

  const calculateTotalCost = useCallback((votes: Record<string, number>) => {
    return Object.values(votes).reduce((sum, v) => sum + calculateQuadraticCost(v), 0);
  }, []);

  const totalCost = calculateTotalCost(allocatedVotes);
  const remainingCredits = serverRemainingCredits - totalCost;

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        if (!user) return;

        const res = await authFetch('/api/vote/status');
        const data = await res.json();
        if (data.creditBudget) setCreditBudget(data.creditBudget);
        if (typeof data.remainingCredits === 'number') {
          setServerRemainingCredits(data.remainingCredits);
        }
        if (data.hasVoted) {
          setHasVoted(true);
          if (onVoteComplete) {
            onVoteComplete();
          }
        }
      } catch (err) {
        logger.error('Failed to check vote status', { error: err });
      } finally {
        setIsLoading(false);
      }
    };
    checkVoteStatus();
  }, [user, onVoteComplete]);

  useEffect(() => {
    const loadBlockedReleases = async () => {
      try {
        const res = await fetch('/api/vote/blocked-releases');
        const data = await res.json();
        if (res.ok && Array.isArray(data.blockedReleaseIds)) {
          setBlockedReleaseIds(new Set(data.blockedReleaseIds));
        }
      } catch (err) {
        logger.error('Failed to load blocked releases', { error: err });
      }
    };
    void loadBlockedReleases();
  }, []);

  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (allTracks.length > 0 && shuffledTracks.length === 0) {
      const array = [...allTracks];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      setShuffledTracks(array);
    }
  }, [allTracks, shuffledTracks.length]);

  const allGenres = useMemo(() => {
    const genreSet = new Set<Genre>();
    shuffledTracks.forEach(track => {
      track.genres.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [shuffledTracks]);

  const filteredTracks = useMemo(() => {
    let filtered = shuffledTracks;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(search) ||
        track.artist.toLowerCase().includes(search)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(track =>
        track.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return filtered;
  }, [shuffledTracks, searchTerm, selectedGenres]);

  const daysUntilPublish = useMemo(() => {
    const now = new Date();
    const diff = nextPublishDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [nextPublishDate]);

  const handleToggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres(current =>
      current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre]
    );
  }, []);


  if (isLoading) {
    return <VotingAreaSkeleton />;
  }

  if (hasVoted) {
    return (
      <Card className="bg-card border border-border p-12 text-center">
        <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {t('voting.alreadyVoted')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold mb-2">
              {t('voting.title')}
            </h1>
            <p className="font-ui text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
              {t('voting.description')}
            </p>
          </div>
        </div>
        <Card className="bg-card border border-border p-4 md:p-5">
          <p className="font-ui text-sm text-foreground font-semibold mb-1">
            {t('voting.quadraticVoting')}
          </p>
          <p className="font-ui text-sm text-muted-foreground leading-relaxed">
            {t('voting.quadraticInfo')}
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center">
                <Coins size={24} weight="fill" className="text-primary" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {remainingCredits}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t('voting.creditsRemaining')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 border border-accent flex items-center justify-center">
                <Lightning size={24} weight="fill" className="text-accent" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {totalCost}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t('voting.totalCostSpent')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center">
                <Calendar size={24} weight="fill" className="text-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl text-foreground data-font">
                  {daysUntilPublish}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t('voting.daysUntilCharts')}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card border border-border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder={t('voting.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-ui"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedGenres([])}
            disabled={selectedGenres.length === 0}
            className="font-ui uppercase tracking-wider"
          >
            {t('voting.clearFilters')}
          </Button>
        </div>

        {allGenres.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                {t('voting.filterGenres')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.slice(0, 15).map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer font-ui text-[10px] uppercase tracking-wider transition-all hover:scale-105"
                  onClick={() => handleToggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 mb-24">
        <AnimatePresence mode="popLayout">
          {filteredTracks.map((track) => {
            const currentVotes = allocatedVotes[track.id] || 0;
            const costForNext = calculateQuadraticCost(currentVotes + 1) - calculateQuadraticCost(currentVotes);
            const isVoteBlocked = blockedReleaseIds.has(track.id);
            const canAffordNext = !isVoteBlocked && remainingCredits >= costForNext;

            return (
              <motion.div
                key={track.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
              >
                <Card className={cn(
                  'bg-card border border-border transition-all',
                  isVoteBlocked ? 'opacity-60 border-amber-500/40' : 'hover:border-primary/50'
                )}>
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4">

                      <div
                        className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative group"
                        onClick={() => onTrackClick(track)}
                      >
                        {/* Play overlay for audio focus */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md z-10">
                           <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                             <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-black border-b-8 border-b-transparent ml-1" />
                           </div>
                        </div>
                        <AlbumArtwork
                          src={track.albumArt}
                          alt={`${track.artist} - ${track.title}`}
                          artist={track.artist}
                          title={track.title}
                          size="medium"
                          glowColor="primary"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h3
                            className="font-display text-lg uppercase tracking-tight text-foreground mb-1 truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onTrackClick(track)}
                          >
                            {track.title}
                          </h3>
                          <div className="font-ui text-sm text-muted-foreground mb-2">
                            {track.artist}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {isVoteBlocked && (
                              <Badge variant="outline" className="font-ui text-[9px] uppercase tracking-wider border-amber-500/50 text-amber-500">
                                {t('voting.integrityReview')}
                              </Badge>
                            )}
                            {track.genres.slice(0, 3).map(genre => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="font-ui text-[9px] uppercase tracking-wider"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col items-center justify-center space-y-1">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0 rounded-none border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                              disabled={isVoteBlocked || currentVotes <= 0}
                              onClick={() => {
                                setAllocatedVotes(prev => ({
                                  ...prev,
                                  [track.id]: Math.max(0, currentVotes - 1)
                                }));
                              }}
                            >
                              <span className="text-xl font-bold font-ui">-</span>
                            </Button>

                            <div className="w-16 h-10 border border-border bg-background flex items-center justify-center data-font text-xl font-bold">
                              {currentVotes}
                            </div>

                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "h-10 w-10 shrink-0 rounded-none border-border transition-all",
                                !canAffordNext ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                              )}
                              disabled={!canAffordNext}
                              onClick={() => {
                                if (canAffordNext) {
                                  setAllocatedVotes(prev => ({
                                    ...prev,
                                    [track.id]: currentVotes + 1
                                  }));
                                } else {
                                  // Brutalismus visual feedback could go here via a toast or wiggle animation state
                                  toast.error("Nicht genug Credits für diese Stimme");
                                }
                              }}
                            >
                              <span className="text-xl font-bold font-ui">+</span>
                            </Button>
                          </div>

                          <div className="h-4">
                            {currentVotes > 0 && (
                              <span className="font-ui text-[10px] text-muted-foreground uppercase tracking-widest">
                                Kostet <span className="text-accent font-bold data-font">{calculateQuadraticCost(currentVotes)}</span> Credits
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTracks.length === 0 && (
        <Card className="bg-card border border-border p-12 text-center">
          <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t('voting.noTracksFound')}
          </p>
        </Card>
      )}

      {/* Sticky Budget Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-ui text-xs text-muted-foreground uppercase tracking-wider">{t('voting.creditsAvailable')}</span>
              <span className={cn(
                "data-font text-3xl font-bold transition-colors",
                remainingCredits === 0 ? "text-destructive" : "text-primary"
              )}>
                {remainingCredits} <span className="text-sm text-muted-foreground">/ {creditBudget}</span>
              </span>
            </div>
            <div className="h-10 w-px bg-border hidden md:block" />
            <div className="flex flex-col">
              <span className="font-ui text-xs text-muted-foreground uppercase tracking-wider">{t('voting.creditsSpent')}</span>
              <span className="data-font text-xl text-accent">
                {totalCost}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none font-ui uppercase tracking-wider"
              onClick={() => setAllocatedVotes({})}
              disabled={totalCost === 0}
            >
              Alle verwerfen
            </Button>
            <Button
              variant="default"
              className="flex-1 md:flex-none font-ui uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={totalCost === 0 || remainingCredits < 0}
              onClick={async () => {
                if (totalCost === 0 || remainingCredits < 0) return;

                try {
                  if (!user) {
                    toast.error("Please login to submit votes");
                    return;
                  }

                  const validVotes = Object.entries(allocatedVotes).reduce((acc, [releaseId, votes]) => {
                    if (votes > 0) acc[releaseId] = votes;
                    return acc;
                  }, {} as Record<string, number>);

                  const res = await authFetch('/api/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'bulk', votes: validVotes }),
                  });

                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    if (res.status === 409) {
                      setHasVoted(true);
                      toast.error(t('voting.alreadyVoted'));
                      if (onVoteComplete) onVoteComplete();
                      return;
                    }
                    if (res.status === 403 && errData.code === 'RELEASE_VOTE_SUSPENDED') {
                      toast.error(t('error.RELEASE_VOTE_SUSPENDED'));
                      return;
                    }
                    throw new Error(errData.code ? t(`error.${errData.code}`) : t('voting.submitFailed'));
                  }

                  const result = await res.json();
                  if (typeof result.remainingCredits === 'number') {
                    setServerRemainingCredits(result.remainingCredits);
                  }
                  setHasVoted(true);
                  toast.success(t('voting.submitSuccess'));
                  if (onVoteComplete) {
                    onVoteComplete();
                  }

                } catch (error) {
                  logger.error('Error submitting votes:', error);
                  toast.error(t('error.submitFailed'));
                  setTimeout(() => window.location.reload(), 2000); // Revert optimistic UI by reloading
                }
              }}
            >
              Abstimmung verbindlich einreichen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
