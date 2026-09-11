'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { HybridChartTable } from '@/components/HybridChartTable';
import { ChartSidebar } from '@/components/ChartSidebar';
import { ChartRankedList } from '@/components/ChartRankedList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useChartShell } from './ChartShellClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChartGenre } from '@/hooks/useChartGenre';
import { filterTracksByMainGenre } from '@/lib/charts/genre-filter';
import { formatHybridWeightsPercent } from '@/lib/math/normalization';
import { DEFAULT_CHART_WEIGHTS } from '@/lib/api/systemSettings';
import type { ChartWeights, Genre, Track } from '@/types';

export function HomeChartsView() {
  return (
    <Suspense fallback={null}>
      <HomeChartsViewInner />
    </Suspense>
  );
}

function HomeChartsViewInner() {
  const { overallChart, isLoading, handleTrackClick, hasVoted } = useChartShell();
  const { t } = useLanguage();
  const genre = useChartGenre();
  const [weights, setWeights] = useState<ChartWeights>(DEFAULT_CHART_WEIGHTS);

  useEffect(() => {
    fetch('/api/charts/weights')
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const tracks = useMemo(
    () => filterTracksByMainGenre(overallChart, genre),
    [overallChart, genre]
  );

  const pct = formatHybridWeightsPercent(weights);
  const weightsLabel = t('chart.weightsFormula')
    .replace('{fan}', String(pct.fan))
    .replace('{expert}', String(pct.expert));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <HybridChartTable
        tracks={tracks}
        isLoading={isLoading}
        onTrackClick={handleTrackClick}
        weightsLabel={weightsLabel}
        genre={genre}
      />
      <ChartSidebar hasVoted={hasVoted} />
    </div>
  );
}

function StreamingPillarList() {
  const { t } = useLanguage();
  const genre = useChartGenre();
  const [tracks, setTracks] = useState<Track[]>([]);
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
          genres: (entry.release?.artist?.genres || []) as Genre[],
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

  const filtered = useMemo(() => filterTracksByMainGenre(tracks, genre), [tracks, genre]);
  const title = genre ? `${t('pillar.streaming')} · ${genre}` : t('pillar.streaming');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold leading-tight">
          {title}
        </h2>
        <p className="font-ui text-sm text-muted-foreground leading-relaxed">{t('pillar.streamingLead')}</p>
      </div>
      <ErrorBoundary level="component">
        {isLoading || filtered.length > 0 ? (
          <ChartRankedList tracks={filtered} isLoading={isLoading} />
        ) : (
          <p className="p-6 text-sm text-muted-foreground border border-border bg-card">{t('chart.streamingEmpty')}</p>
        )}
      </ErrorBoundary>
    </div>
  );
}

interface PillarChartListProps {
  pillar: 'fan' | 'club' | 'streaming';
}

const PILLAR_CONFIG = {
  fan: { titleKey: 'pillar.fan' as const, tracksKey: 'filteredFanCharts' as const, leadKey: 'pillar.fanLead' as const },
  club: { titleKey: 'pillar.club' as const, tracksKey: 'filteredExpertCharts' as const, leadKey: 'pillar.clubLead' as const },
};

export function PillarChartList({ pillar }: PillarChartListProps) {
  return (
    <Suspense fallback={null}>
      {pillar === 'streaming' ? <StreamingPillarList /> : <VotePillarList pillar={pillar} />}
    </Suspense>
  );
}

function VotePillarList({ pillar }: { pillar: 'fan' | 'club' }) {
  const shell = useChartShell();
  const { t } = useLanguage();
  const genre = useChartGenre();
  const config = PILLAR_CONFIG[pillar];
  const source = shell[config.tracksKey];
  const tracks = useMemo(() => filterTracksByMainGenre(source, genre), [source, genre]);
  const { isLoading, handleTrackClick } = shell;
  const title = genre ? `${t(config.titleKey)} · ${genre}` : t(config.titleKey);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold leading-tight">
          {title}
        </h2>
        <p className="font-ui text-sm text-muted-foreground leading-relaxed">{t(config.leadKey)}</p>
      </div>
      <ErrorBoundary level="component">
        <ChartRankedList tracks={tracks} isLoading={isLoading} onTrackClick={handleTrackClick} />
      </ErrorBoundary>
    </div>
  );
}
