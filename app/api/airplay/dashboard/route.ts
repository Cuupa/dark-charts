import { NextRequest, NextResponse } from 'next/server';
import { ApiError, withErrorHandler } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { listLabelRoster } from '@/lib/api/label-roster';
import { summarizeAirplay } from '@/lib/radio/airplayQuery';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { listRadioAirplayViews } from '@/lib/radio/stationRepository';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { userId, role } = await requireAuth(req);
  if (role !== 'BAND' && role !== 'LABEL' && role !== 'ADMIN' && role !== 'admin') {
    throw new ApiError(403, 'Airplay dashboard is for bands, labels, and admins');
  }

  const supabase = createServiceRoleSupabaseClient();
  const owned: { id: string; name: string }[] = [];

  if (role === 'BAND') {
    const { data: band, error } = await supabase
      .from('band_profiles')
      .select('artistId')
      .eq('userId', userId)
      .maybeSingle();
    if (error) throw new ApiError(500, error.message);
    if (band?.artistId) {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, name')
        .eq('id', band.artistId)
        .maybeSingle();
      if (artist) owned.push(artist);
    }
  } else if (role === 'LABEL') {
    const roster = await listLabelRoster(supabase, userId);
    owned.push(...roster.map((artist) => ({ id: artist.id, name: artist.name })));
  } else {
    const artistId = req.nextUrl.searchParams.get('artistId');
    if (artistId) {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, name')
        .eq('id', artistId)
        .maybeSingle();
      if (artist) owned.push(artist);
    }
  }

  const settings = await getRadioMonitorSettings(supabase);
  const summaries = [];
  for (const artist of owned) {
    const events = await listRadioAirplayViews(supabase, { artistId: artist.id, limit: 500 });
    summaries.push({
      artistId: artist.id,
      ...summarizeAirplay(events, {
        minConfidence: settings.minMatchConfidence,
        artistName: artist.name,
      }),
      recent: events
        .filter((event) => event.confidence >= settings.minMatchConfidence && event.artistId)
        .slice(0, 20)
        .map((event) => ({
          station: event.stationName,
          country: event.country,
          release: event.releaseTitle,
          observedAt: event.observedAt,
          confidence: event.confidence,
        })),
    });
  }

  return NextResponse.json({
    disclaimer:
      'Publicly reachable scene radios we monitor — not a complete census of all internet radio.',
    artists: summaries,
  });
});
