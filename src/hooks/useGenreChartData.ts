import { useEffect, useState } from 'react';
import { ChartType, Genre, MainGenre, Track } from '@/types';

type ChartApiEntry = {
  id: string;
  placement: number;
  movement: number | null;
  communityPower: number | null;
  release?: {
    id: string;
    title: string;
    spotifyId: string | null;
    itunesArtworkUrl: string | null;
    vercelBlobUrl: string | null;
    artist?: {
      name: string;
      genres: string[] | null;
      imageUrl: string | null;
    } | null;
  } | null;
};

function mapEntryToTrack(
  entry: ChartApiEntry,
  chartType: ChartType
): Track {
  const movement = entry.movement ?? 0;
  return {
    id: entry.release?.id || entry.id,
    rank: entry.placement,
    artist: entry.release?.artist?.name || '',
    title: entry.release?.title || '',
    genres: (entry.release?.artist?.genres || []) as Genre[],
    movement,
    chartType,
    albumArt:
      entry.release?.itunesArtworkUrl ||
      entry.release?.vercelBlobUrl ||
      entry.release?.artist?.imageUrl ||
      undefined,
    spotifyUri: entry.release?.spotifyId
      ? `spotify:track:${entry.release.spotifyId}`
      : undefined,
    community_power: entry.communityPower ?? undefined,
    trend_direction: movement > 0 ? 'up' : movement < 0 ? 'down' : 'stable',
    weeksInChart: 1,
    votes: 0,
  };
}

async function fetchGenreChart(
  type: 'fan' | 'expert' | 'combined',
  mainGenre: MainGenre,
  subGenre?: Genre | null
): Promise<Track[]> {
  const params = new URLSearchParams({
    type,
    completed: 'true',
    limit: '50',
  });

  if (subGenre) {
    params.set('genre', subGenre);
  } else {
    params.set('mainGenre', mainGenre);
  }

  const res = await fetch(`/api/charts?${params.toString()}`);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.success || !Array.isArray(data.entries)) return [];

  const chartType = type === 'combined' ? 'overall' : type;
  return data.entries.map((entry: ChartApiEntry) => mapEntryToTrack(entry, chartType));
}

export function useGenreChartData(mainGenre: MainGenre, subGenre?: Genre | null) {
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasServerData, setHasServerData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [fan, expert] = await Promise.all([
          fetchGenreChart('fan', mainGenre, subGenre),
          fetchGenreChart('expert', mainGenre, subGenre),
        ]);

        if (cancelled) return;

        setFanCharts(fan);
        setExpertCharts(expert);
        setHasServerData(fan.length > 0 || expert.length > 0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mainGenre, subGenre]);

  return {
    fanCharts,
    expertCharts,
    isLoading,
    hasServerData,
  };
}