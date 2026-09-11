import type { Genre, Track } from '@/types';

export interface ReleaseWithArtist {
  id: string;
  title: string;
  spotifyId?: string | null;
  itunesArtworkUrl?: string | null;
  vercelBlobUrl?: string | null;
  r2ArtworkUrl?: string | null;
  artworkUrl?: string | null;
  genres?: string[] | null;
  artist?: {
    name: string;
    genres?: string[] | null;
    imageUrl?: string | null;
  } | null;
}

export function mapReleaseToTrack(release: ReleaseWithArtist): Track {
  const genres = (release.genres?.length
    ? release.genres
    : release.artist?.genres ?? []) as Genre[];

  return {
    id: release.id,
    rank: 0,
    artist: release.artist?.name ?? '',
    title: release.title,
    genres,
    movement: 0,
    chartType: 'fan',
    albumArt:
      release.r2ArtworkUrl ||
      release.itunesArtworkUrl ||
      release.vercelBlobUrl ||
      release.artworkUrl ||
      release.artist?.imageUrl ||
      undefined,
    spotifyUri: release.spotifyId ? `spotify:track:${release.spotifyId}` : undefined,
    weeksInChart: 0,
    votes: 0,
  };
}