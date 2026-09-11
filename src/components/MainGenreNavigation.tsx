import Link from 'next/link';
import { MainGenre } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export type GenreNavValue = MainGenre | 'overall';

interface MainGenreNavigationProps {
  activeGenre: GenreNavValue;
  onGenreChange: (genre: MainGenre) => void;
  className?: string;
  linkMode?: boolean;
  getGenreHref?: (genre: GenreNavValue) => string;
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

  const items: { value: GenreNavValue; label: string }[] = [
    { value: 'overall', label: t('genre.all') },
    { value: 'Gothic', label: t('genre.gothic') },
    { value: 'Metal', label: t('genre.metal') },
    { value: 'Dark Electro', label: t('genre.darkelectro') },
    { value: 'Crossover', label: t('genre.crossover') },
  ];

  const renderGenre = (genre: { value: GenreNavValue; label: string }, className: string) => {
    if (linkMode && getGenreHref) {
      return (
        <Link key={genre.value} href={getGenreHref(genre.value)} className={className} data-genre={genre.value}>
          {genre.label}
        </Link>
      );
    }

    return (
      <button
        key={genre.value}
        data-genre={genre.value}
        onClick={() => {
          if (genre.value !== 'overall') onGenreChange(genre.value);
        }}
        className={className}
      >
        {genre.label}
      </button>
    );
  };

  const itemClass = (value: GenreNavValue, mobile: boolean) =>
    cn(
      mobile
        ? 'flex-shrink-0 snap-center px-6 py-3 font-ui text-xs uppercase tracking-[0.15em] font-bold snap-transition border'
        : 'flex-1 px-4 py-3 font-ui text-sm uppercase tracking-[0.15em] font-bold snap-transition border-r last:border-r-0 border-border',
      activeGenre === value
        ? mobile
          ? 'bg-accent text-accent-foreground border-accent'
          : 'bg-accent text-accent-foreground'
        : mobile
          ? 'bg-card text-muted-foreground border-border hover:bg-accent/20'
          : 'bg-card text-muted-foreground hover:bg-accent/20 hover:text-foreground'
    );

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeButton = scrollRef.current.querySelector(`[data-genre="${activeGenre}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeGenre, isMobile]);

  return (
    <div className={cn('w-full border-t border-border', className)}>
      <div className="w-full px-4 md:px-8 py-2">
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((genre) => renderGenre(genre, itemClass(genre.value, true)))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-0 border border-border">
              {items.map((genre) => renderGenre(genre, itemClass(genre.value, false)))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
