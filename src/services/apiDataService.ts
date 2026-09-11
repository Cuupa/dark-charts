import { ChartData, Genre, IDataService, Track } from '@/types';
import { ComprehensiveDataService } from './comprehensiveDataService';
import { logger } from '@/lib/logger';
import { isSupabaseEnvConfigured } from '@/lib/supabase/isConfigured';
import { calculateOverallChart } from '@/lib/math/normalization';

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
  chartType: 'fan' | 'expert' | 'streaming' | 'overall'
): Track {
  const movement = entry.movement ?? 0;
  return {
    id: entry.release?.id || entry.id,
    rank: entry.placement,
    artist: entry.release?.artist?.name || 'Unknown Artist',
    title: entry.release?.title || 'Unknown Title',
    genres: (entry.release?.artist?.genres || []) as Genre[],
    movement,
    chartType,
    albumArt:
      entry.release?.itunesArtworkUrl ||
      entry.release?.vercelBlobUrl ||
      entry.release?.artist?.imageUrl ||
      undefined,
    spotifyUri: entry.release?.spotifyId ? `spotify:track:${entry.release.spotifyId}` : undefined,
    community_power: entry.communityPower ?? undefined,
    trend_direction: movement > 0 ? 'up' : movement < 0 ? 'down' : 'stable',
    weeksInChart: 1,
    votes: 0,
  };
}

type ChartApiResponse = {
  success: boolean;
  entries: ChartApiEntry[];
  source?: 'database' | 'itunes';
};

async function fetchChartType(
  type: 'fan' | 'expert' | 'streaming' | 'combined'
): Promise<{ tracks: Track[]; source?: 'database' | 'itunes' }> {
  const res = await fetch(`/api/charts?type=${type}&completed=true&limit=50`);
  if (!res.ok) return { tracks: [] };
  const data = (await res.json()) as ChartApiResponse;
  if (!data.success || !Array.isArray(data.entries) || data.entries.length === 0) {
    return { tracks: [], source: data.source };
  }
  const chartType = type === 'combined' ? 'overall' : type;
  return {
    tracks: data.entries.map((entry: ChartApiEntry) => mapEntryToTrack(entry, chartType)),
    source: data.source,
  };
}

export class ApiDataService implements IDataService {
  private fallback = new ComprehensiveDataService();
  private fanCharts: Track[] = [];
  private expertCharts: Track[] = [];
  private combinedCharts: Track[] = [];
  /** True when Supabase is unconfigured and demo catalog data is shown. */
  isUsingMockData = false;
  /** True when charts are populated from iTunes bootstrap (no DB/env). */
  isUsingItunesData = false;

  private cacheCharts(data: ChartData) {
    this.fanCharts = data.fanCharts;
    this.expertCharts = data.expertCharts;
    this.combinedCharts = data.combinedCharts ?? [];
  }

  async getAllCharts(): Promise<ChartData> {
    if (!isSupabaseEnvConfigured()) {
      logger.info('Supabase not configured — using demo chart data');
      this.isUsingMockData = true;
      this.isUsingItunesData = false;
      const data = await this.fallback.getAllCharts();
      this.cacheCharts(data);
      return data;
    }

    try {
      const [fanResult, expertResult, combinedResult] = await Promise.all([
        fetchChartType('fan'),
        fetchChartType('expert'),
        fetchChartType('combined'),
      ]);

      this.isUsingMockData = false;
      this.isUsingItunesData =
        fanResult.source === 'itunes' ||
        expertResult.source === 'itunes' ||
        combinedResult.source === 'itunes';

      const data = {
        fanCharts: fanResult.tracks,
        expertCharts: expertResult.tracks,
        streamingCharts: [] as Track[],
        combinedCharts: combinedResult.tracks,
      };
      this.cacheCharts(data);
      return data;
    } catch (error) {
      logger.error('Failed to fetch charts from API', { error });
      this.isUsingMockData = false;
      this.isUsingItunesData = false;
      const data = {
        fanCharts: [] as Track[],
        expertCharts: [] as Track[],
        streamingCharts: [] as Track[],
        combinedCharts: [] as Track[],
      };
      this.cacheCharts(data);
      return data;
    }
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    if (!isSupabaseEnvConfigured()) {
      this.isUsingMockData = true;
      this.isUsingItunesData = false;
      return this.fallback.getChartByType(type);
    }

    const { tracks } = await fetchChartType(type);
    return tracks;
  }

  calculateOverallChart(): Track[] {
    if (this.combinedCharts.length > 0) {
      return this.combinedCharts;
    }

    if (this.fanCharts.length === 0 && this.expertCharts.length === 0) {
      return [];
    }

    return calculateOverallChart(this.fanCharts, this.expertCharts, {
      fan: 0.55,
      expert: 0.45,
      streaming: 0,
    });
  }

  async vote(_trackId: string, _direction: 'up' | 'down'): Promise<void> {
    logger.warn('Legacy up/down voting is deprecated; use quadratic voting at /voting');
  }

  async getVotes(_trackId: string): Promise<number> {
    return 0;
  }

  async getUserVotesForTrack(_trackId: string): Promise<number> {
    return 0;
  }

  getNextChartPublicationDate(): Date {
    return this.fallback.getNextChartPublicationDate();
  }
}
