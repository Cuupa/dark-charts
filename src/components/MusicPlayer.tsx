import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from '@phosphor-icons/react';
import { Track } from '@/types';
import { audioPlayerService } from '@/services/audioPlayerService';

interface MusicPlayerProps {
  currentTrack: Track | null;
  onNext?: () => void;
  onPrevious?: () => void;
  allTracks?: Track[];
}

export function MusicPlayer({ currentTrack, onNext, onPrevious }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = audioPlayerService.addListener((playing) => {
      setIsPlaying(playing);
    });
    return unsubscribe;
  }, []);

  if (!currentTrack) {
    return null;
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary z-50">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 4px
          )`
        }}
      />
      
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentTrack.albumArt && (
              <img 
                src={currentTrack.albumArt} 
                alt={currentTrack.title}
                className="w-12 h-12 object-cover border border-border"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="data-font text-sm font-bold text-foreground truncate">
                {currentTrack.artist}
              </div>
              <div className="data-font text-xs text-muted-foreground truncate">
                {currentTrack.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label="Previous Track"
              className="w-8 h-8 flex items-center justify-center border border-border text-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed snap-transition"
            >
              <SkipBack weight="fill" className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause Track" : "Play Track"}
              className="w-10 h-10 flex items-center justify-center border border-border bg-primary text-primary-foreground hover:glow-primary snap-transition"
            >
              {isPlaying ? (
                <Pause weight="fill" className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Play weight="fill" className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next Track"
              className="w-8 h-8 flex items-center justify-center border border-border text-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed snap-transition"
            >
              <SkipForward weight="fill" className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1">
            <div className="flex-1 h-1 bg-secondary border border-border relative">
              <div 
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: isPlaying ? '35%' : '0%' }}
              />
            </div>
            <div className="data-font text-xs text-muted-foreground tabular-nums">
              {isPlaying ? '1:23' : '0:00'} / 3:45
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
