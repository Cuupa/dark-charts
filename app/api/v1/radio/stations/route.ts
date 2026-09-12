import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { listStations } from '@/lib/radio/stationRepository';

export const GET = createV1GetHandler(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const stations = await listStations(supabase);
  return {
    stations: stations
      .filter((station) => station.monitorEnabled && !station.legalHold)
      .map((station) => ({
        id: station.id,
        name: station.name,
        country: station.country,
        tags: station.tags,
        health: station.healthStatus,
      })),
  };
});

export const OPTIONS = v1OptionsHandler;
