'use client';

import { useEffect, useState } from 'react';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { HybridChartTable } from '@/components/HybridChartTable';
import { ChartSidebar } from '@/components/ChartSidebar';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useChartShell } from './ChartShellClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatHybridWeightsPercent } from '@/lib/math/normalization';
import { DEFAULT_CHART_WEIGHTS } from '@/lib/api/systemSettings';
import type { ChartWeights } from '@/types';

export function HomeChartsView() {
  const { overallChart, isLoading, handleTrackClick, hasVoted } = useChartShell();
  const { t } = useLanguage();
  const [weights, setWeights] = useState<ChartWeights>(DEFAULT_CHART_WEIGHTS);

  useEffect(() => {
    fetch('/api/charts/weights')
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const pct = formatHybridWeightsPercent(weights);
  const weightsLabel = t('chart.weightsFormula')
    .replace('{fan}', String(pct.fan))
    .replace('{expert}', String(pct.expert));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <HybridChartTable
        tracks={overallChart}
        isLoading={isLoading}
        onTrackClick={handleTrackClick}
        weightsLabel={weightsLabel}
      />
      <ChartSidebar hasVoted={hasVoted} />
    </div>
  );
}

function StreamingPillarList() {
  const { t } = useLanguage();
  const [tracks, setTracks] = useState<import('@/types').Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/charts?type=streaming&completed=true&limit=50')
      .then((res) => res.json())
      .then((data: { entries?: Array<{ id: string; placement: number; movement: number | null; release?: { id: string; title: string; itunesArtworkUrl: string | null; vercelBlobUrl: string | null; artist?: { name: string; genres: string[] | null } | null } | null }> }) => {
        if (cancelled) return;
        const mapped = (data.entries ?? []).map((entry) => ({
          id: entry.release?.id || entry.id,
          rank: entry.placement,
          artist: entry.release?.artist?.name || t('chart.unknownArtist'),
          title: entry.release?.title || t('chart.unknownTitle'),
          genres: (entry.release?.artist?.genres || []) as import('@/types').Genre[],
          movement: entry.movement ?? 0,
          chartType: 'streaming' as const,
          albumArt: entry.release?.itunesArtworkUrl || entry.release?.vercelBlobUrl || undefined,
          votes: 0,
        }));
        setTracks(mapped);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="space-y-6">
      <ErrorBoundary level="component">
        <Card className="bg-card border border-border">
          <div className="p-4 md:p-5 border-b border-border space-y-2">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {t('pillar.streaming')}
            </h2>
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">{t('pillar.streamingLead')}</p>
          </div>
          {isLoading ? (
            <div>
              {Array.from({ length: 10 }).map((_, index) => (
                <ChartEntrySkeleton key={index} index={index} />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('chart.streamingEmpty')}</p>
          ) : (
            tracks.map((track, index) => (
              <ChartEntry key={track.id} track={track} index={index} />
            ))
          )}
        </Card>
      </ErrorBoundary>
    </div>
  );
}

interface PillarChartListProps {
  pillar: 'fan' | 'club' | 'streaming';
}

const PILLAR_CONFIG = {
  fan: { titleKey: 'pillar.fan' as const, tracksKey: 'filteredFanCharts' as const },
  club: { titleKey: 'pillar.club' as const, tracksKey: 'filteredExpertCharts' as const },
};

export function PillarChartList({ pillar }: PillarChartListProps) {
  if (pillar === 'streaming') {
    return <StreamingPillarList />;
  }
  return <VotePillarList pillar={pillar} />;
}

function VotePillarList({ pillar }: { pillar: 'fan' | 'club' }) {
  const shell = useChartShell();
  const { t } = useLanguage();
  const config = PILLAR_CONFIG[pillar];
  const tracks = shell[config.tracksKey];
  const { isLoading, handleTrackClick } = shell;

  return (
    <div className="space-y-6">
      <ErrorBoundary level="component">
        <Card className="bg-card border border-border">
          <div className="p-4 md:p-5 border-b border-border space-y-2">
            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
              {t(config.titleKey)}
            </h2>
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">
              {t(pillar === 'fan' ? 'pillar.fanLead' : 'pillar.clubLead')}
            </p>
          </div>
          {isLoading ? (
            <div>
              {Array.from({ length: 20 }).map((_, index) => (
                <ChartEntrySkeleton key={index} index={index} />
              ))}
            </div>
          ) : (
            <motion.div layout>
              <AnimatePresence mode="popLayout">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track?.id || `track-${index}`}
                    layoutId={`track-${track?.id || index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ChartEntry
                      track={track}
                      index={index}
                      onClick={handleTrackClick}
                      animate
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </Card>
      </ErrorBoundary>
    </div>
  );
}