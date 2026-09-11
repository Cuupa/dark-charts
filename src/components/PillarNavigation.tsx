import Link from 'next/link';
import type { PillarSlug } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

export type PillarView = PillarSlug | 'overview';

interface PillarNavigationProps {
  activePillar: PillarView;
  onPillarChange: (pillar: PillarView) => void;
  className?: string;
  linkMode?: boolean;
  getPillarHref?: (pillar: PillarView) => string;
}

export function PillarNavigation({
  activePillar,
  onPillarChange,
  className,
  linkMode = false,
  getPillarHref,
}: PillarNavigationProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const renderPillar = (
    pillar: { value: PillarView; label: string },
    className: string
  ) => {
    if (linkMode && getPillarHref) {
      return (
        <Link
          key={pillar.value}
          href={getPillarHref(pillar.value)}
          className={className}
        >
          {pillar.label}
        </Link>
      );
    }

    return (
      <button
        key={pillar.value}
        onClick={() => onPillarChange(pillar.value)}
        className={className}
      >
        {pillar.label}
      </button>
    );
  };

  const pillars: { value: PillarView; label: string }[] = [
    { value: 'overview', label: t('pillar.overall') },
    { value: 'club', label: t('pillar.club') },
    { value: 'fan', label: t('pillar.fan') },
    { value: 'streaming', label: t('pillar.streaming') },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full px-4 md:px-8 py-2">
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            <div className="flex overflow-x-auto gap-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {pillars.map((pillar) =>
                renderPillar(
                  pillar,
                  cn(
                    'flex-shrink-0 whitespace-nowrap px-6 py-3 font-ui text-xs uppercase tracking-[0.15em] font-bold snap-transition border',
                    activePillar === pillar.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-primary/20 hover:text-foreground'
                  )
                )
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-0">
              <div className="inline-flex border border-border w-full md:w-auto overflow-hidden">
                {pillars.map((pillar) =>
                  renderPillar(
                    pillar,
                    cn(
                      'flex-1 md:flex-none px-4 md:px-8 py-3 font-ui text-xs uppercase tracking-[0.2em] font-bold snap-transition border-r last:border-r-0 border-border',
                      activePillar === pillar.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-primary/20 hover:text-foreground'
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
