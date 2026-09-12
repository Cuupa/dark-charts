import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { filterAirplayEvents, summarizeAirplay } from '@/lib/radio/airplayQuery';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { listRadioAirplayViews } from '@/lib/radio/stationRepository';

const querySchema = z.object({
  station: z.string().uuid().optional(),
  country: z.string().trim().max(8).optional(),
  from: z.string().min(4).optional(),
  to: z.string().min(4).optional(),
});

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid parameters', 'VALIDATION_ERROR');
  }
  const supabase = createServiceRoleSupabaseClient();
  const settings = await getRadioMonitorSettings(supabase);
  const events = await listRadioAirplayViews(supabase, {
    limit: 1000,
    stationId: parsed.data.station,
  });
  const filtered = filterAirplayEvents(events, {
    stationId: parsed.data.station,
    country: parsed.data.country,
    from: parsed.data.from,
    to: parsed.data.to,
    minConfidence: settings.minMatchConfidence,
  });
  return {
    ...summarizeAirplay(filtered, { minConfidence: settings.minMatchConfidence }),
    events: filtered.slice(0, 100).map((event) => ({
      artist: event.artistName,
      release: event.releaseTitle,
      station: event.stationName,
      country: event.country,
      observedAt: event.observedAt,
      confidence: event.confidence,
    })),
  };
});

export const OPTIONS = v1OptionsHandler;
