import type { ChartType, Genre, MainGenre, Track } from '@/types';
import { mainGenrePath, pillarChartPath } from '@/lib/routes';

export function chartMetric(track: Track): number | null {
  const value = track.score ?? (track.chartType === 'fan' ? track.fanScore : track.chartType === 'expert' ? track.expertScore : track.chartType === 'streaming' ? track.streamingScore : undefined);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Personal lists normalize each independent pool before applying user weights. */
export function buildPersonalChart(fan: Track[], club: Track[], fanPercent: number): Track[] {
  const weight = Number.isFinite(fanPercent) ? Math.min(100, Math.max(0, fanPercent)) / 100 : 0.55;
  const records = new Map<string, Track>();
  const scores = (tracks: Track[]) => {
    const max = Math.max(1, ...tracks.map(t => chartMetric(t) ?? 0));
    return new Map(tracks.map(t => [t.id, (chartMetric(t) ?? 0) / max * 100]));
  };
  const fans = scores(fan);
  const clubs = scores(club);
  [...fan, ...club].forEach(t => { if (!records.has(t.id)) records.set(t.id, t); });
  return [...records.values()].map(t => ({ ...t, chartType: 'overall' as ChartType, movement: undefined, trend_direction: undefined, score: (fans.get(t.id) ?? 0) * weight + (clubs.get(t.id) ?? 0) * (1 - weight) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export function chartFilterHref(pillar: string, genre: MainGenre | null, sub: Genre | null): string {
  const mode = ['fan', 'club', 'streaming'].includes(pillar) ? pillar : 'overall';
  if (genre) return `${mainGenrePath(genre, sub ?? undefined)}${mode !== 'overall' ? `?pillar=${mode}` : ''}`;
  return mode === 'overall' ? '/' : pillarChartPath(mode as 'fan' | 'club' | 'streaming');
}
