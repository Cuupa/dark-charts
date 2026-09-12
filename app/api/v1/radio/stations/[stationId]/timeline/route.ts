import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/errors';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { filterAirplayEvents } from '@/lib/radio/airplayQuery';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { listRadioAirplayViews, listStations } from '@/lib/radio/stationRepository';

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const parts = req.nextUrl.pathname.split('/');
  const stationId = parts.at(-2);
  if (!stationId) throw new ApiError(400, 'Missing station id');
  const supabase = createServiceRoleSupabaseClient();
  const stations = await listStations(supabase);
  const station = stations.find((row) => row.id === stationId);
  if (!station || station.legalHold) throw new ApiError(404, 'Station not found');
  const settings = await getRadioMonitorSettings(supabase);
  const events = await listRadioAirplayViews(supabase, { stationId, limit: 500 });
  const matched = filterAirplayEvents(events, { minConfidence: settings.minMatchConfidence });
  return {
    station: { id: station.id, name: station.name, country: station.country, health: station.healthStatus },
    timeline: matched.map((event) => ({
      artist: event.artistName,
      release: event.releaseTitle,
      observedAt: event.observedAt,
      confidence: event.confidence,
      method: event.detectionMethod,
    })),
  };
});

export const OPTIONS = v1OptionsHandler;
