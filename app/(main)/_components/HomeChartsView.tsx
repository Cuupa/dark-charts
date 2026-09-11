'use client';
import { useEffect, useState } from 'react';
import { HybridChartTable } from '@/components/HybridChartTable';
import { ChartHeader } from '@/components/charts/ChartHeader';
import { ChartNavigation } from './ChartNavigation';
import { ChartSidebar } from '@/components/ChartSidebar';
import { useChartShell } from './ChartShellClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { isDemoMode } from '@/lib/demo/mode';
import { ApiDataService } from '@/services/apiDataService';
import type { Track } from '@/types';

export function HomeChartsView() { return <ChartsView pillar="overall" />; }
export function PillarChartList({ pillar }: { pillar: 'fan' | 'club' | 'streaming' }) { return <ChartsView pillar={pillar} />; }
function ChartsView({ pillar }: { pillar: 'overall' | 'fan' | 'club' | 'streaming' }) {
  const shell = useChartShell();
  const { t } = useLanguage();
  const [streaming, setStreaming] = useState<Track[]>([]);
  const [streamError, setStreamError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(pillar === 'streaming' && !isDemoMode());
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (pillar !== 'streaming' || isDemoMode()) return;
    let active = true;
    setStreamLoading(true); setStreamError(false);
    new ApiDataService().getChartByType('streaming').then(data => { if (active) setStreaming(data); }).catch(() => { if (active) setStreamError(true); }).finally(() => { if (active) setStreamLoading(false); });
    return () => { active = false; };
  }, [pillar, attempt]);
  const tracks = pillar === 'overall' ? shell.overallChart : pillar === 'fan' ? shell.filteredFanCharts : pillar === 'club' ? shell.filteredExpertCharts : streaming;
  const weights = shell.edition?.weights;
  return <>
    <ChartHeader title={t(pillar === 'overall' ? 'chart.hybridTitle' : `pillar.${pillar}`)} edition={shell.edition} lead={pillar === 'streaming' ? t('pillar.streamingLead') : undefined} />
    <ChartNavigation />
    <HybridChartTable tracks={tracks} isLoading={pillar === 'streaming' ? streamLoading : shell.isLoading} error={pillar === 'streaming' ? streamError : !!shell.error} onRetry={pillar === 'streaming' ? () => setAttempt(n => n + 1) : shell.reload} onTrackClick={track => shell.playTrack(track, tracks)} weightsLabel={pillar === 'overall' && weights ? t('ui.weights', { fan: weights.fan, club: weights.expert }) : undefined} />
    <ChartSidebar hasVoted={shell.hasVoted} />
  </>;
}
