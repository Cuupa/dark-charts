import type { AppSupabaseClient } from '@/types/supabase-client';
import type { AirplayEventLike } from './types';
import { rollupAirplayEvents } from './rollup';
import { calculateAirplayScore } from './airplayScore';

export interface AirplayRollupResult {
  weekStart: string;
  eventsProcessed: number;
  snapshotsUpserted: number;
}

export async function rollupAirplayWeek(
  db: AppSupabaseClient,
  weekStartIso: string,
  previousWeekStartIso: string
): Promise<AirplayRollupResult> {
  const { data: events, error } = await db
    .from('airplay_events')
    .select('releaseId, source, reach, weight, sourceStationId')
    .eq('weekStart', weekStartIso);

  if (error) {
    throw new Error(`Failed to fetch airplay events: ${error.message}`);
  }

  const aggregates = rollupAirplayEvents(
    (events ?? []) as AirplayEventLike[],
    weekStartIso
  );

  if (aggregates.length === 0) {
    return {
      weekStart: weekStartIso,
      eventsProcessed: events?.length ?? 0,
      snapshotsUpserted: 0,
    };
  }

  const { data: prev } = await db
    .from('airplay_snapshots')
    .select('*')
    .eq('weekStart', previousWeekStartIso);

  const prevByRelease = new Map((prev ?? []).map((s) => [s.releaseId, s]));

  const rows = aggregates.map((agg) => ({
    releaseId: agg.releaseId,
    weekStart: agg.weekStart,
    playlistAddCount: agg.playlistAddCount,
    playlistReach: agg.playlistReach,
    radioSpinCount: agg.radioSpinCount,
    radioStationCount: agg.radioStationCount,
    djSpinCount: agg.djSpinCount,
    totalReach: agg.totalReach,
    score: calculateAirplayScore(agg, prevByRelease.get(agg.releaseId) ?? null),
  }));

  const { error: upsertError } = await db
    .from('airplay_snapshots')
    .upsert(rows, { onConflict: 'releaseId,weekStart' });

  if (upsertError) {
    throw new Error(`Failed to upsert airplay snapshots: ${upsertError.message}`);
  }

  return {
    weekStart: weekStartIso,
    eventsProcessed: events?.length ?? 0,
    snapshotsUpserted: rows.length,
  };
}
