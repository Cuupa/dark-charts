import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { summarizeAirplay } from '@/lib/radio/airplayQuery';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { listRadioAirplayViews } from '@/lib/radio/stationRepository';

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const releaseId = req.nextUrl.pathname.split('/').at(-1);
  if (!releaseId) throw new ApiError(400, 'Missing release id');
  const supabase = createServiceRoleSupabaseClient();
  const { data: release, error } = await supabase
    .from('releases')
    .select('id, title, artist:artists(name)')
    .eq('id', releaseId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!release) throw new ApiError(404, 'Release not found');
  const settings = await getRadioMonitorSettings(supabase);
  const events = await listRadioAirplayViews(supabase, { releaseId, limit: 1000 });
  const artistJoin = release.artist as { name: string } | { name: string }[] | null;
  const artistName = Array.isArray(artistJoin) ? artistJoin[0]?.name : artistJoin?.name;
  return { ...summarizeAirplay(events, {
    minConfidence: settings.minMatchConfidence,
    artistName: artistName ?? null,
    releaseTitle: release.title,
  }) };
});

export const OPTIONS = v1OptionsHandler;
