import type { AppSupabaseClient } from '@/types/supabase-client';
import {
  formatChartEntry,
  getChartEntries,
  getLatestWeekStart,
  type FormattedChartEntry,
} from '@/lib/api/charts';
import { isPublicChartRelease } from '@/lib/charts/public-visibility';

export type ChartTypeFilter = 'fan' | 'expert' | 'streaming' | 'combined';
export type SearchType = 'all' | 'songs' | 'artists' | 'charts';

export interface TopArtist {
  id: string;
  name: string;
  imageUrl: string | null;
  spotifyId: string | null;
  genres: string[];
  chartAppearances: number;
  bestPlacement: number;
  score: number;
}

export interface TopCategory {
  genre: string;
  trackCount: number;
  artistCount: number;
  score: number;
}

export interface SongSearchResult {
  id: string;
  title: string;
  releaseType: string;
  releaseDate: string;
  spotifyId: string | null;
  artworkUrl: string | null;
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  imageUrl: string | null;
  spotifyId: string | null;
  genres: string[];
  verified: boolean;
}

export interface ChartSearchResult extends FormattedChartEntry {}

const CHART_TYPES: ChartTypeFilter[] = ['fan', 'expert', 'streaming', 'combined'];

function artworkUrl(release: {
  r2ArtworkUrl?: string | null;
  artworkUrl?: string | null;
  highResArtworkUrl?: string | null;
  itunesArtworkUrl?: string | null;
  vercelBlobUrl?: string | null;
}): string | null {
  return (
    release.r2ArtworkUrl ??
    release.artworkUrl ??
    release.highResArtworkUrl ??
    release.itunesArtworkUrl ??
    release.vercelBlobUrl ??
    null
  );
}

export async function resolveWeekStart(
  supabase: AppSupabaseClient,
  chartType: ChartTypeFilter,
  completed = true
): Promise<string | null> {
  if (completed) {
    return getLatestWeekStart(supabase, chartType);
  }
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function getCurrentCharts(
  supabase: AppSupabaseClient,
  options: {
    type?: ChartTypeFilter | 'all';
    limit?: number;
    completed?: boolean;
  } = {}
): Promise<{
  weekStart: string | null;
  charts: Partial<Record<ChartTypeFilter, FormattedChartEntry[]>>;
}> {
  const { type = 'all', limit = 50, completed = true } = options;
  const types = type === 'all' ? CHART_TYPES : [type];
  const charts: Partial<Record<ChartTypeFilter, FormattedChartEntry[]>> = {};
  let weekStart: string | null = null;

  for (const chartType of types) {
    const ws = await resolveWeekStart(supabase, chartType, completed);
    if (!ws) {
      charts[chartType] = [];
      continue;
    }
    if (!weekStart) weekStart = ws;
    charts[chartType] = await getChartEntries(supabase, chartType, ws, limit);
  }

  return { weekStart, charts };
}

export async function getTopArtists(
  supabase: AppSupabaseClient,
  limit = 10
): Promise<{ weekStart: string | null; artists: TopArtist[] }> {
  const weekStart =
    (await getLatestWeekStart(supabase, 'combined')) ??
    (await getLatestWeekStart(supabase, 'fan'));

  if (!weekStart) {
    return { weekStart: null, artists: [] };
  }

  const { data, error } = await supabase
    .from('chart_entries')
    .select(
      `
        placement,
        chartType,
        release:releases (
          artist:artists (
            id,
            name,
            spotifyId,
            genres,
            imageUrl
          )
        )
      `
    )
    .eq('weekStart', weekStart)
    .lte('placement', 50);

  if (error) {
    throw new Error(`Failed to fetch top artists: ${error.message}`);
  }

  const scores = new Map<
    string,
    TopArtist & { artistIds: Set<string> }
  >();

  type ChartArtistRow = {
    placement: number;
    chartType: string;
    release: {
      artist: {
        id: string;
        name: string;
        spotifyId: string | null;
        genres: string[] | null;
        imageUrl: string | null;
      } | null;
    } | null;
  };

  for (const entry of (data ?? []) as unknown as ChartArtistRow[]) {
    const artist = entry.release?.artist;
    if (!artist?.id) continue;

    const placementScore = Math.max(0, 51 - entry.placement);
    const existing = scores.get(artist.id);

    if (!existing) {
      scores.set(artist.id, {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        spotifyId: artist.spotifyId,
        genres: artist.genres ?? [],
        chartAppearances: 1,
        bestPlacement: entry.placement,
        score: placementScore,
        artistIds: new Set([artist.id]),
      });
    } else {
      existing.chartAppearances += 1;
      existing.bestPlacement = Math.min(existing.bestPlacement, entry.placement);
      existing.score += placementScore;
    }
  }

  const artists = Array.from(scores.values())
    .map(({ artistIds: _a, ...rest }) => rest)
    .sort((a, b) => b.score - a.score || a.bestPlacement - b.bestPlacement)
    .slice(0, limit);

  return { weekStart, artists };
}

export async function getTopCategories(
  supabase: AppSupabaseClient,
  limit = 10
): Promise<{ weekStart: string | null; categories: TopCategory[] }> {
  const weekStart =
    (await getLatestWeekStart(supabase, 'combined')) ??
    (await getLatestWeekStart(supabase, 'fan'));

  if (!weekStart) {
    return { weekStart: null, categories: [] };
  }

  const { data, error } = await supabase
    .from('chart_entries')
    .select(
      `
        placement,
        release:releases (
          genres,
          artist:artists ( genres )
        )
      `
    )
    .eq('weekStart', weekStart)
    .lte('placement', 50);

  if (error) {
    throw new Error(`Failed to fetch top categories: ${error.message}`);
  }

  const genreStats = new Map<
    string,
    { trackCount: number; artistGenres: Set<string>; score: number }
  >();

  type CategoryRow = {
    placement: number;
    release: {
      genres: string[] | null;
      artist: { genres: string[] | null } | null;
    } | null;
  };

  for (const entry of (data ?? []) as unknown as CategoryRow[]) {
    const placementScore = Math.max(0, 51 - entry.placement);
    const releaseGenres = entry.release?.genres ?? [];
    const artistGenres = entry.release?.artist?.genres ?? [];
    const allGenres = new Set([...releaseGenres, ...artistGenres]);

    for (const genre of allGenres) {
      if (!genre) continue;
      const stat = genreStats.get(genre) ?? {
        trackCount: 0,
        artistGenres: new Set<string>(),
        score: 0,
      };
      stat.trackCount += 1;
      stat.score += placementScore;
      artistGenres.forEach((g: string) => stat.artistGenres.add(g));
      genreStats.set(genre, stat);
    }
  }

  const categories = Array.from(genreStats.entries())
    .map(([genre, stat]) => ({
      genre,
      trackCount: stat.trackCount,
      artistCount: stat.artistGenres.size,
      score: stat.score,
    }))
    .sort((a, b) => b.score - a.score || b.trackCount - a.trackCount)
    .slice(0, limit);

  return { weekStart, categories };
}

export async function getCatalogOverview(
  supabase: AppSupabaseClient,
  options: { chartLimit?: number; topLimit?: number } = {}
): Promise<{
  weekStart: string | null;
  charts: Partial<Record<ChartTypeFilter, FormattedChartEntry[]>>;
  topArtists: TopArtist[];
  topCategories: TopCategory[];
}> {
  const chartLimit = options.chartLimit ?? 10;
  const topLimit = options.topLimit ?? 10;

  const [chartsResult, artistsResult, categoriesResult] = await Promise.all([
    getCurrentCharts(supabase, { type: 'all', limit: chartLimit, completed: true }),
    getTopArtists(supabase, topLimit),
    getTopCategories(supabase, topLimit),
  ]);

  return {
    weekStart: chartsResult.weekStart ?? artistsResult.weekStart,
    charts: chartsResult.charts,
    topArtists: artistsResult.artists,
    topCategories: categoriesResult.categories,
  };
}

export async function searchCatalog(
  supabase: AppSupabaseClient,
  query: string,
  type: SearchType = 'all',
  limit = 20
): Promise<{
  query: string;
  songs: SongSearchResult[];
  artists: ArtistSearchResult[];
  charts: ChartSearchResult[];
}> {
  const pattern = `%${query.trim()}%`;
  const songs: SongSearchResult[] = [];
  const artists: ArtistSearchResult[] = [];
  const charts: ChartSearchResult[] = [];

  const searchSongs = type === 'all' || type === 'songs';
  const searchArtists = type === 'all' || type === 'artists';
  const searchCharts = type === 'all' || type === 'charts';

  if (searchSongs) {
    const { data, error } = await supabase
      .from('releases')
      .select('id, title, releaseType, releaseDate, spotifyId, r2ArtworkUrl, artworkUrl, highResArtworkUrl, itunesArtworkUrl, vercelBlobUrl, artist:artists(id, name, imageUrl)')
      .eq('isVisible', true)
      .ilike('title', pattern)
      .order('releaseDate', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Song search failed: ${error.message}`);

    type SongRow = {
      id: string;
      title: string;
      releaseType: string;
      releaseDate: string;
      spotifyId: string | null;
      r2ArtworkUrl: string | null;
      artworkUrl: string | null;
      highResArtworkUrl: string | null;
      itunesArtworkUrl: string | null;
      vercelBlobUrl: string | null;
      artist: { id: string; name: string; imageUrl: string | null } | null;
    };

    for (const row of (data ?? []) as unknown as SongRow[]) {
      songs.push({
        id: row.id,
        title: row.title,
        releaseType: row.releaseType,
        releaseDate: row.releaseDate,
        spotifyId: row.spotifyId,
        artworkUrl: artworkUrl(row),
        artist: row.artist
          ? { id: row.artist.id, name: row.artist.name, imageUrl: row.artist.imageUrl }
          : null,
      });
    }
  }

  if (searchArtists) {
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, imageUrl, spotifyId, genres, verified')
      .eq('isVisible', true)
      .ilike('name', pattern)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`Artist search failed: ${error.message}`);

    artists.push(
      ...(data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl,
        spotifyId: row.spotifyId,
        genres: row.genres ?? [],
        verified: row.verified,
      }))
    );
  }

  if (searchCharts) {
    const weekStart =
      (await getLatestWeekStart(supabase, 'combined')) ??
      (await getLatestWeekStart(supabase, 'fan'));

    if (weekStart) {
      const { data, error } = await supabase
        .from('chart_entries')
        .select(
          `
            *,
            release:releases (
              *,
              artist:artists (
                id, name, spotifyId, genres, bio, profileLink, imageUrl, isVisible
              )
            )
          `
        )
        .eq('weekStart', weekStart)
        .order('placement', { ascending: true })
        .limit(100);

      if (error) throw new Error(`Chart search failed: ${error.message}`);

      const q = query.trim().toLowerCase();
      const matched = (data ?? [])
        .filter((entry) => isPublicChartRelease(entry.release))
        .filter((entry) => {
          const title = entry.release?.title?.toLowerCase() ?? '';
          const artist = entry.release?.artist?.name?.toLowerCase() ?? '';
          const chartType = entry.chartType?.toLowerCase() ?? '';
          return title.includes(q) || artist.includes(q) || chartType.includes(q);
        })
        .slice(0, limit)
        .map((entry) => formatChartEntry(entry as Parameters<typeof formatChartEntry>[0]));

      charts.push(...matched);
    }
  }

  return { query, songs, artists, charts };
}