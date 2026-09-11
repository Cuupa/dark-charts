import Link from 'next/link';
import { MainGenre } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MainGenreNavigationProps {
  activeGenre: MainGenre | 'overall';
  onGenreChange: (genre: MainGenre) => void;
  className?: string;
  linkMode?: boolean;
  getGenreHref?: (genre: MainGenre) => string;
}

export function MainGenreNavigation({
  activeGenre,
  onGenreChange,
  className,
  linkMode = false,
  getGenreHref,
}: MainGenreNavigationProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const renderGenre = (
    genre: { value: MainGenre; label: string },
    className: string,
    dataGenre?: string
  ) => {
    if (linkMode && getGenreHref) {
      return (
        <Link key={genre.value} href={getGenreHref(genre.value)} className={className} data-genre={dataGenre}>
          {genre.label}
        </Link>
      );
    }

    return (
      <button
        key={genre.value}
        data-genre={dataGenre}
        onClick={() => onGenreChange(genre.value)}
        className={className}
      >
        {genre.label}
      </button>
    );
  };

  const genres: { value: MainGenre; label: string }[] = [
    { value: 'Gothic', label: t('genre.gothic') },
    { value: 'Metal', label: t('genre.metal') },
    { value: 'Dark Electro', label: t('genre.darkelectro') },
    { value: 'Crossover', label: t('genre.crossover') },
  ];

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeButton = scrollRef.current.querySelector(`[data-genre="${activeGenre}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeGenre, isMobile]);

  return (
    <div className={cn("w-full border-t border-border", className)}>
      <div className="w-full px-4 md:px-8 py-2">
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {genres.map((genre) =>
                renderGenre(
                  genre,
                  cn(
                    'flex-shrink-0 snap-center px-6 py-3 font-ui text-xs uppercase tracking-[0.15em] font-bold snap-transition border',
                    activeGenre === genre.value
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent/20'
                  ),
                  genre.value
                )
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-0 overflow-hidden border border-border">
              {genres.map((genre) =>
                renderGenre(
                  genre,
                  cn(
                    'flex-1 px-6 py-4 font-ui text-sm uppercase tracking-[0.15em] font-bold snap-transition border-r last:border-r-0 border-border',
                    activeGenre === genre.value
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card text-muted-foreground hover:bg-accent/20 hover:text-foreground'
                  )
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
