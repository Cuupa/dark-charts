import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getWeekStartMonday } from '@/lib/week';
import { ingestStreamingSnapshots } from '@/lib/api/streaming-snapshots';
import { getArtistStreamingData, isSpotifyConfigured } from '@/lib/spotify-server';
import { fetchYoutubePopularity } from '@/lib/youtube-metrics';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  if (!isSpotifyConfigured()) {
    logger.info('Streaming snapshot cron skipped — Spotify is not configured');
    return NextResponse.json({ success: true, skipped: true, reason: 'spotify_unconfigured' });
  }

  const supabase = createServiceRoleSupabaseClient();
  const weekStart = getWeekStartMonday();
  const result = await ingestStreamingSnapshots({
    supabase,
    weekStart,
    fetchSpotify: async (spotifyId) => {
      try {
        const data = await getArtistStreamingData(spotifyId);
        return {
          popularity: data.popularity,
          followerCount: data.followerCount,
          topTrackAvgPopularity: data.topTrackAvgPopularity,
        };
      } catch (error) {
        logger.warn('Spotify snapshot fetch failed', { spotifyId, error });
        return null;
      }
    },
    fetchYoutube: fetchYoutubePopularity,
  });

  logger.info('Streaming snapshots ingested', { ...result, weekStart: weekStart.toISOString() });

  return NextResponse.json({
    success: true,
    weekStart: weekStart.toISOString(),
    ...result,
  });
});
