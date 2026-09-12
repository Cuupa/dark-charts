import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { summarizeAirplay } from '@/lib/radio/airplayQuery';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { listRadioAirplayViews } from '@/lib/radio/stationRepository';

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const artistId = req.nextUrl.pathname.split('/').at(-1);
  if (!artistId) throw new ApiError(400, 'Missing artist id');
  const supabase = createServiceRoleSupabaseClient();
  const { data: artist, error } = await supabase
    .from('artists')
    .select('id, name')
    .eq('id', artistId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!artist) throw new ApiError(404, 'Artist not found');
  const settings = await getRadioMonitorSettings(supabase);
  const events = await listRadioAirplayViews(supabase, { artistId, limit: 1000 });
  return { ...summarizeAirplay(events, {
    minConfidence: settings.minMatchConfidence,
    artistName: artist.name,
  }) };
});

export const OPTIONS = v1OptionsHandler;
