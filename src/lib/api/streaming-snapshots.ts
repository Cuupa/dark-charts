import type { SupabaseClient } from '@supabase/supabase-js';
import { mapWithConcurrency } from '@/lib/mapWithConcurrency';

export const STREAMING_SNAPSHOT_BATCH = 40;

export interface SpotifySnapshotInput {
  popularity: number;
  followerCount: number;
  topTrackAvgPopularity: number;
}

interface VisibleArtist {
  id: string;
  spotifyId: string | null;
  socialLinks: { youtube?: string } | null;
}

export async function ingestStreamingSnapshots(params: {
  supabase: SupabaseClient;
  weekStart: Date;
  limit?: number;
  fetchSpotify: (spotifyId: string) => Promise<SpotifySnapshotInput | null>;
  fetchYoutube?: (url: string) => Promise<number>;
}): Promise<{ processed: number; written: number; skipped: number }> {
  const { supabase, weekStart, fetchSpotify, fetchYoutube } = params;
  const limit = params.limit ?? STREAMING_SNAPSHOT_BATCH;
  const weekStartIso = weekStart.toISOString();

  const { data: artists, error } = await supabase
    .from('artists')
    .select('id, spotifyId, socialLinks')
    .eq('isVisible', true)
    .not('spotifyId', 'is', null)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load artists for streaming snapshots: ${error.message}`);
  }

  const rows = (artists ?? []) as VisibleArtist[];
  let written = 0;
  let skipped = 0;

  await mapWithConcurrency(rows, 2, async (artist) => {
    if (!artist.spotifyId) {
      skipped += 1;
      return;
    }

    const spotify = await fetchSpotify(artist.spotifyId);
    if (!spotify) {
      skipped += 1;
      return;
    }

    const youtubeUrl = artist.socialLinks?.youtube;
    const youtubePopularity = youtubeUrl && fetchYoutube ? await fetchYoutube(youtubeUrl) : 0;

    const payload = {
      artistId: artist.id,
      weekStart: weekStartIso,
      spotifyPopularity: spotify.popularity,
      followerCount: spotify.followerCount,
      topTrackPopularity: spotify.topTrackAvgPopularity,
      youtubePopularity,
    };

    const { data: existing, error: existingError } = await supabase
      .from('streaming_snapshots')
      .select('id')
      .eq('artistId', artist.id)
      .eq('weekStart', weekStartIso)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to read streaming snapshot: ${existingError.message}`);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('streaming_snapshots')
        .update(payload)
        .eq('id', existing.id);
      if (updateError) {
        throw new Error(`Failed to update streaming snapshot: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase.from('streaming_snapshots').insert(payload);
      if (insertError) {
        throw new Error(`Failed to insert streaming snapshot: ${insertError.message}`);
      }
    }

    written += 1;
  });

  return { processed: rows.length, written, skipped };
}
