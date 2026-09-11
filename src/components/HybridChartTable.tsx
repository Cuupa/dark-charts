'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChartEntry } from '@/components/ChartEntry';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES } from '@/lib/routes';
import { getIsoWeekYear } from '@/lib/week';
import type { Track } from '@/types';

interface HybridChartTableProps {
  tracks: Track[];
  isLoading?: boolean;
  onTrackClick?: (track: Track) => void;
  weightsLabel?: string;
}

export function HybridChartTable({
  tracks,
  isLoading,
  onTrackClick,
  weightsLabel,
}: HybridChartTableProps) {
  const { t } = useLanguage();
  const { weekNumber, year } = getIsoWeekYear(new Date());

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="display-font text-2xl md:text-3xl text-foreground">
          {t('chart.hybridTitle')} — KW {weekNumber}/{year}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          {t('chart.whyThisWeekBody')}
        </p>
        {weightsLabel && (
          <p className="text-sm text-muted-foreground">{weightsLabel}</p>
        )}
        <Link
          href={ROUTES.methodology}
          className="inline-block text-sm text-primary hover:underline"
        >
          {t('chart.methodologyLink')} →
        </Link>
      </div>

      <ErrorBoundary level="component">
        <Card className="bg-card border border-border overflow-hidden">
          {isLoading ? (
            <div>
              {Array.from({ length: 20 }).map((_, index) => (
                <ChartEntrySkeleton key={index} index={index} />
              ))}
            </div>
          ) : (
            <motion.ul layout className="list-none p-0 m-0">
              <AnimatePresence mode="popLayout">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track?.id || `track-${index}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    <ChartEntry
                      track={track}
                      index={index}
                      onClick={onTrackClick}
                      animate
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </Card>
      </ErrorBoundary>
    </div>
  );
}
