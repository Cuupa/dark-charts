import { mainGenreMap } from '@/lib/config/genres';
import type { Genre, MainGenre, Track } from '@/types';

export function trackMatchesMainGenre(
  track: { genres?: string[] | null },
  genre: MainGenre
): boolean {
  const tags = track.genres ?? [];
  if (tags.includes(genre)) return true;
  const subgenres: readonly string[] = mainGenreMap[genre];
  return tags.some((tag) => subgenres.includes(tag as Genre));
}

export function filterTracksByMainGenre(tracks: Track[], genre: MainGenre | null): Track[] {
  if (!genre) return tracks;
  return tracks
    .filter((item) => trackMatchesMainGenre(item, genre))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
