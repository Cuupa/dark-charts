import { useState, useMemo, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { Track } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { AlbumArtwork } from './AlbumArtwork';
import { CaretUp, CaretDown, Trash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';

interface ExpertVotingAreaProps {
  allTracks: Track[];
  onTrackClick: (track: Track) => void;
  onVoteComplete?: () => void;
}

export function ExpertVotingArea({ allTracks, onTrackClick, onVoteComplete }: ExpertVotingAreaProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedReleaseIds, setBlockedReleaseIds] = useState<Set<string>>(new Set());

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

  const handleAddToTop10 = useCallback((track: Track) => {
    if (blockedReleaseIds.has(track.id)) {
      toast.error(t('voting.integrityReview'));
      return;
    }
    if (selectedTracks.length >= 10) {
      toast.error('Top 10 is already full');
      return;
    }
    if (selectedTracks.find(t => t.id === track.id)) {
      toast.error('Track is already in Top 10');
      return;
    }
    setSelectedTracks(prev => [...prev, track]);
  }, [selectedTracks, blockedReleaseIds, t]);

  const handleRemoveFromTop10 = useCallback((trackId: string) => {
    setSelectedTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSelectedTracks(prev => {
      const newTracks = [...prev];
      [newTracks[index - 1], newTracks[index]] = [newTracks[index], newTracks[index - 1]];
      return newTracks;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    if (index === selectedTracks.length - 1) return;
    setSelectedTracks(prev => {
      const newTracks = [...prev];
      [newTracks[index + 1], newTracks[index]] = [newTracks[index], newTracks[index + 1]];
      return newTracks;
    });
  }, []);

  const handleSubmit = async () => {
    if (selectedTracks.length !== 10) return;

    try {
      if (!user) {
        toast.error("Please login to submit votes");
        return;
      }

      const votes: Record<string, number> = {};
      selectedTracks.forEach((track, index) => {
        votes[track.id] = index + 1; // rank 1 to 10
      });

      const res = await authFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bulk', votes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 403 && errorData.code === 'RELEASE_VOTE_SUSPENDED') {
          toast.error(t('voting.integrityReview'));
          return;
        }
        throw new Error(errorData.error || 'Failed to submit votes');
      }

      toast.success(t('voting.submitSuccess') || 'Vote submitted');
      if (onVoteComplete) {
        onVoteComplete();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit votes';
      logger.error('Error submitting expert votes', { error });
      toast.error(message);
    }
  };

  const filteredPool = useMemo(() => {
    let filtered = allTracks.filter(track => !selectedTracks.find(st => st.id === track.id));

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(search) ||
        track.artist.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allTracks, selectedTracks, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold mb-2">
            {t('voting.expertTitle')}
          </h1>
          <p className="font-ui text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {t('voting.expertDescription')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column: Top 10 Slots */}
        <div className="space-y-4">
          <h2 className="font-display text-xl uppercase tracking-wider">{t('voting.expertList')}</h2>
          <Card className="bg-card border border-border p-4 space-y-2">
            {[...Array(10)].map((_, i) => {
              const track = selectedTracks[i];
              return (
                <div key={i} className="flex items-center gap-4 bg-secondary/50 p-2 rounded-md border border-border">
                  <div className="w-8 text-center font-display text-xl text-muted-foreground">
                    #{i + 1}
                  </div>
                  {track ? (
                    <>
                      <div className="shrink-0 cursor-pointer w-12 h-12">
                        <AlbumArtwork
                          src={track.albumArt}
                          alt={`${track.artist} - ${track.title}`}
                          artist={track.artist}
                          title={track.title}
                          size="small"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-sm truncate uppercase tracking-tight text-foreground">{track.title}</div>
                        <div className="font-ui text-xs text-muted-foreground truncate">{track.artist}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                        >
                          <CaretUp size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(i)}
                          disabled={i === selectedTracks.length - 1}
                        >
                          <CaretDown size={16} />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveFromTop10(track.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 font-ui text-sm text-muted-foreground italic pl-4">
                      Slot leer
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-4">
              <Button
                variant="default"
                className="w-full font-ui uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={selectedTracks.length !== 10}
                onClick={handleSubmit}
              >
                Top 10 verbindlich einreichen
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Track Pool */}
        <div className="space-y-4">
          <h2 className="font-display text-xl uppercase tracking-wider">Track Pool</h2>

          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Search tracks or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-ui"
            />
          </div>

          <div className="space-y-2 h-[600px] overflow-y-auto pr-2">
            {filteredPool.map(track => (
              <Card key={track.id} className="bg-card border border-border p-3 flex items-center gap-4 hover:border-primary/50 transition-all">
                <div
                  className="shrink-0 cursor-pointer"
                  onClick={() => onTrackClick(track)}
                >
                  <AlbumArtwork
                    src={track.albumArt}
                    alt={`${track.artist} - ${track.title}`}
                    artist={track.artist}
                    title={track.title}
                    size="small"
                  />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTrackClick(track)}>
                  <div className="font-display text-sm uppercase tracking-tight text-foreground truncate hover:text-primary transition-colors">{track.title}</div>
                  <div className="font-ui text-xs text-muted-foreground truncate">{track.artist}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleAddToTop10(track)}
                  disabled={selectedTracks.length >= 10}
                >
                  Hinzufügen
                </Button>
              </Card>
            ))}

            {filteredPool.length === 0 && (
              <div className="text-center p-8 text-muted-foreground font-ui text-sm">
                Keine weiteren Tracks gefunden
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
