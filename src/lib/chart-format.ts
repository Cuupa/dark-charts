import { filterPublicChartEntries } from '@/lib/charts/public-visibility';

export function formatChartEntry(entry: {
  id: string;
  placement: number;
  score: number;
  communityPower: number | null;
  movement: number | null;
  chartType: string;
  weekStart: string;
  createdAt: string;
  release?: {
    id: string;
    title: string;
    releaseType: string | null;
    releaseDate: string;
    spotifyId: string | null;
    odesliLinks: unknown;
    itunesArtworkUrl: string | null;
    vercelBlobUrl: string | null;
    isVisible?: boolean | null;
    artist?: {
      id: string;
      name: string;
      spotifyId: string | null;
      genres: string[] | null;
      bio: string | null;
      profileLink: string | null;
      imageUrl: string | null;
      isVisible?: boolean | null;
    } | null;
  } | null;
}) {
  return {
    id: entry.id,
    placement: entry.placement,
    score: entry.score,
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
  };
}

export function formatPublicChartEntries(
  entries: Array<Parameters<typeof formatChartEntry>[0] | null | undefined> | null | undefined
) {
  return filterPublicChartEntries(
    (entries ?? []).filter((entry): entry is Parameters<typeof formatChartEntry>[0] =>
      Boolean(entry)
    )
  ).map(formatChartEntry);
}