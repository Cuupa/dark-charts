import type { AppSupabaseClient } from '@/types/supabase-client'
import type { Database } from '@/types/database'
import { isPublicChartRelease } from '@/lib/charts/public-visibility'

type ChartEntryRow = Database['public']['Tables']['chart_entries']['Row']
type ReleaseRow = Database['public']['Tables']['releases']['Row']
type ArtistRow = Database['public']['Tables']['artists']['Row']

export interface FormattedChartRelease {
  id: string
  title: string
  releaseType: string
  releaseDate: string
  spotifyId: string | null
  odesliLinks: ReleaseRow['odesliLinks']
  itunesArtworkUrl: string | null
  vercelBlobUrl: string | null
  r2ArtworkUrl: string | null
  artworkUrl: string | null
  artist: {
    id: string
    name: string
    spotifyId: string | null
    genres: string[]
    bio: string | null
    profileLink: string | null
    imageUrl: string | null
  } | null
}

export interface FormattedChartEntry {
  id: string
  placement: number
  score: number
  fanScore: number
  expertScore: number
  communityPower: number
  movement: number
  chartType: string
  weekStart: string
  createdAt: string
  release: FormattedChartRelease | null
}

type ChartEntryWithRelations = ChartEntryRow & {
  release:
    | (ReleaseRow & {
        artist: Pick<
          ArtistRow,
          | 'id'
          | 'name'
          | 'spotifyId'
          | 'genres'
          | 'bio'
          | 'profileLink'
          | 'imageUrl'
          | 'isVisible'
        > | null
      })
    | null
}

export async function getLatestWeekStart(
  supabase: AppSupabaseClient,
  chartType: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chart_entries')
    .select('weekStart')
    .eq('chartType', chartType)
    .order('weekStart', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch latest week start: ${error.message}`)
  }

  return data?.weekStart ?? null
}

export function formatChartEntry(entry: ChartEntryWithRelations): FormattedChartEntry {
  return {
    id: entry.id,
    placement: entry.placement,
    score: entry.score,
    fanScore: entry.fanScore,
    expertScore: entry.expertScore,
    communityPower: entry.communityPower,
    movement: entry.movement,
    chartType: entry.chartType,
    weekStart: entry.weekStart,
    createdAt: entry.createdAt,
    release: entry.release
      ? {
          id: entry.release.id,
          title: entry.release.title,
          releaseType: entry.release.releaseType,
          releaseDate: entry.release.releaseDate,
          spotifyId: entry.release.spotifyId,
          odesliLinks: entry.release.odesliLinks,
          itunesArtworkUrl: entry.release.itunesArtworkUrl,
          vercelBlobUrl: entry.release.vercelBlobUrl,
          r2ArtworkUrl: entry.release.r2ArtworkUrl,
          artworkUrl:
            entry.release.r2ArtworkUrl ??
            entry.release.artworkUrl ??
            entry.release.highResArtworkUrl ??
            entry.release.itunesArtworkUrl,
          artist: entry.release.artist
            ? {
                id: entry.release.artist.id,
                name: entry.release.artist.name,
                spotifyId: entry.release.artist.spotifyId,
                genres: entry.release.artist.genres,
                bio: entry.release.artist.bio,
                profileLink: entry.release.artist.profileLink,
                imageUrl: entry.release.artist.imageUrl,
              }
            : null,
        }
      : null,
  }
}

export async function getChartEntries(
  supabase: AppSupabaseClient,
  chartType: string,
  weekStart: string,
  limit = 100
): Promise<FormattedChartEntry[]> {
  const { data, error } = await supabase
    .from('chart_entries')
    .select(
      `
        *,
        release:releases (
          *,
          artist:artists (
            id,
            name,
            spotifyId,
            genres,
            bio,
            profileLink,
            imageUrl,
            isVisible
          )
        )
      `
    )
    .eq('chartType', chartType)
    .eq('weekStart', weekStart)
    .order('placement', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch chart entries: ${error.message}`)
  }

  return ((data ?? []) as ChartEntryWithRelations[])
    .filter((entry) => isPublicChartRelease(entry.release))
    .map(formatChartEntry)
}