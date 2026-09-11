import { ChartData, Genre, IDataService, Track } from '@/types';
import { getDemoCharts } from '@/lib/demo/catalog';
import { isDemoMode } from '@/lib/demo/mode';
import { z } from 'zod';
import { logger } from '@/lib/logger';

type ChartApiEntry = {
  id: string;
  placement: number;
  movement: number | null;
  communityPower: number | null;
  score?: number | null;
  weekStart?: string;
  release?: {
    id: string;
    title: string;
    spotifyId: string | null;
    itunesArtworkUrl: string | null;
    vercelBlobUrl: string | null;
    artist?: {
      id?: string;
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
    chartEntryId: entry.id,
    artistId: entry.release?.artist?.id,
    score: entry.score ?? undefined,
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

    trend_direction: movement > 0 ? 'up' : movement < 0 ? 'down' : 'stable',

  };
}

const chartResponseSchema = z.object({
  success: z.boolean(),
  source: z.enum(['database', 'itunes']).optional(),
  entries: z.array(z.object({
    id: z.string(), placement: z.number(), movement: z.number().nullable().optional().default(null),
    score: z.number().nullable().optional(), weekStart: z.string().optional(),
    communityPower: z.number().nullable().optional().default(null),
    release: z.object({
      id: z.string(), title: z.string(), spotifyId: z.string().nullable().optional().default(null),
      itunesArtworkUrl: z.string().nullable().optional().default(null),
      vercelBlobUrl: z.string().nullable().optional().default(null),
      artist: z.object({ id: z.string().optional(), name: z.string(), genres: z.array(z.string()).nullable().optional().default(null), imageUrl: z.string().nullable().optional().default(null) }).nullable().optional(),
    }).nullable().optional(),
  })),
});

async function fetchChartType(
  type: 'fan' | 'expert' | 'streaming' | 'combined'
): Promise<{ tracks: Track[]; source?: 'database' | 'itunes'; weekStart?: string }> {
  const res = await fetch(`/api/charts?type=${type}&completed=true&limit=50`);
  if (!res.ok) throw new Error('Charts unavailable');
  const data = chartResponseSchema.parse(await res.json());
  if (!data.success || !Array.isArray(data.entries) || data.entries.length === 0) {
    return { tracks: [], source: data.source };
  }
  const chartType = type === 'combined' ? 'overall' : type;
  return {
    tracks: data.entries.map((entry: ChartApiEntry) => mapEntryToTrack(entry, chartType)),
    source: data.source,
    weekStart: data.entries[0]?.weekStart,
  };
}

export class ApiDataService implements IDataService {

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
    if (isDemoMode()) {
      logger.info('Supabase not configured — using demo chart data');
      this.isUsingMockData = true;
      this.isUsingItunesData = false;
      const data = getDemoCharts();
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

      const data: ChartData = {
        edition: combinedResult.weekStart ? { weekStart: combinedResult.weekStart, status: "published", source: combinedResult.source ?? "database" } : undefined,
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
      throw error;

    }
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    if (isDemoMode()) {
      this.isUsingMockData = true;
      this.isUsingItunesData = false;
      const data = getDemoCharts();
      return type === 'fan' ? data.fanCharts : type === 'expert' ? data.expertCharts : [];
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

    return [];
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
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + (8 - (next.getUTCDay() || 7)));
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
}
