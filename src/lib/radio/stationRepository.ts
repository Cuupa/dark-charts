import type { AppSupabaseClient } from '@/types/supabase-client';
import type { Database } from '@/types/database';
import type { DiscoveredStation } from './discovery/types';
import type { CatalogIndex } from './matchCatalog';
import type { RadioAirplayInsert, StationProbePatch, WorkerHeartbeat, WorkerStation } from './workerTick';
import type { AirplayEventView } from './airplayQuery';

type StationRow = Database['public']['Tables']['radio_stations']['Row'];
type EventRow = Database['public']['Tables']['airplay_events']['Row'];

export async function listStations(db: AppSupabaseClient): Promise<StationRow[]> {
  const { data, error } = await db
    .from('radio_stations')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(`Failed to list radio stations: ${error.message}`);
  return (data ?? []) as StationRow[];
}

export async function listWorkerStations(db: AppSupabaseClient): Promise<WorkerStation[]> {
  const { data, error } = await db
    .from('radio_stations')
    .select(
      'id, name, streamUrl, nowPlayingUrl, metadataMode, monitorEnabled, legalHold, lastProbeAt, priority, probeIntervalSeconds, consecutiveFailures'
    )
    .eq('monitorEnabled', true)
    .eq('legalHold', false);
  if (error) throw new Error(`Failed to list monitored stations: ${error.message}`);
  return (data ?? []) as WorkerStation[];
}

export async function createManualStation(
  db: AppSupabaseClient,
  input: { name: string; streamUrl: string; country?: string | null; nowPlayingUrl?: string | null }
): Promise<StationRow> {
  const { data, error } = await db
    .from('radio_stations')
    .insert({
      name: input.name,
      streamUrl: input.streamUrl,
      country: input.country ?? null,
      nowPlayingUrl: input.nowPlayingUrl ?? null,
      discoverySource: 'manual',
      monitorEnabled: false,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create station');
  return data as StationRow;
}

export async function updateStation(
  db: AppSupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      StationRow,
      | 'name'
      | 'streamUrl'
      | 'nowPlayingUrl'
      | 'country'
      | 'monitorEnabled'
      | 'legalHold'
      | 'priority'
      | 'probeIntervalSeconds'
      | 'metadataMode'
      | 'consecutiveFailures'
      | 'healthStatus'
      | 'isActive'
    >
  >
): Promise<StationRow> {
  const { data, error } = await db
    .from('radio_stations')
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update station');
  return data as StationRow;
}

export async function deleteStation(db: AppSupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('radio_stations').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete station: ${error.message}`);
}

export async function upsertCandidates(
  db: AppSupabaseClient,
  candidates: DiscoveredStation[]
): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const candidate of candidates) {
    const { data: existing, error: lookupError } = await db
      .from('radio_stations')
      .select('id, streamUrl')
      .eq('discoverySource', candidate.discoverySource)
      .eq('externalId', candidate.externalId)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (existing) {
      const streamChanged = existing.streamUrl !== candidate.streamUrl;
      const update: Record<string, unknown> = {
          name: candidate.name,
          streamUrl: candidate.streamUrl,
          homepageUrl: candidate.homepageUrl,
          country: candidate.country,
          tags: candidate.tags,
          bitrate: candidate.bitrate,
          codec: candidate.codec,
          updatedAt: new Date().toISOString(),
      };
      if (streamChanged) update.healthStatus = 'url_changed';
      const { error } = await db
        .from('radio_stations')
        .update(update)
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
      upserted += 1;
      continue;
    }

    const { error } = await db.from('radio_stations').insert({
      name: candidate.name,
      streamUrl: candidate.streamUrl,
      homepageUrl: candidate.homepageUrl,
      country: candidate.country,
      tags: candidate.tags,
      bitrate: candidate.bitrate,
      codec: candidate.codec,
      discoverySource: candidate.discoverySource,
      externalId: candidate.externalId,
      monitorEnabled: false,
    });
    if (error) throw new Error(error.message);
    upserted += 1;
  }
  return { upserted };
}

export async function markStationProbed(
  db: AppSupabaseClient,
  stationId: string,
  patch: StationProbePatch
): Promise<void> {
  const { error } = await db
    .from('radio_stations')
    .update({
      lastProbeAt: patch.lastProbeAt,
      lastMetadataAt: patch.lastMetadataAt ?? undefined,
      lastError: patch.lastError,
      healthStatus: patch.healthStatus,
      consecutiveFailures: patch.consecutiveFailures,
      updatedAt: patch.lastProbeAt,
    })
    .eq('id', stationId);
  if (error) throw new Error(`Failed to update station probe: ${error.message}`);
}

export async function insertAirplayEvent(
  db: AppSupabaseClient,
  event: RadioAirplayInsert
): Promise<'inserted' | 'duplicate'> {
  const { error } = await db.from('airplay_events').insert(event);
  if (!error) return 'inserted';
  if (error.code === '23505' || /duplicate|unique/i.test(error.message)) return 'duplicate';
  throw new Error(`Failed to insert airplay event: ${error.message}`);
}

export async function touchHeartbeat(
  db: AppSupabaseClient,
  payload: WorkerHeartbeat
): Promise<void> {
  const { error } = await db.from('radio_monitor_heartbeat').upsert({
    id: 'worker',
    seenAt: payload.seenAt,
    probesLastMinute: payload.probesLastMinute,
    error: payload.error,
    workerVersion: payload.workerVersion ?? null,
  });
  if (error) throw new Error(`Failed to write radio heartbeat: ${error.message}`);
}

export async function getHeartbeat(
  db: AppSupabaseClient
): Promise<Database['public']['Tables']['radio_monitor_heartbeat']['Row'] | null> {
  const { data, error } = await db
    .from('radio_monitor_heartbeat')
    .select('*')
    .eq('id', 'worker')
    .maybeSingle();
  if (error) throw new Error(`Failed to read radio heartbeat: ${error.message}`);
  return data as Database['public']['Tables']['radio_monitor_heartbeat']['Row'] | null;
}

export async function loadCatalogIndex(db: AppSupabaseClient): Promise<CatalogIndex> {
  const { data: artists, error: artistError } = await db
    .from('artists')
    .select('id, name')
    .eq('isVisible', true);
  if (artistError) throw new Error(`Failed to load artists: ${artistError.message}`);

  const { data: releases, error: releaseError } = await db
    .from('releases')
    .select('id, artistId, title')
    .eq('isVisible', true);
  if (releaseError) throw new Error(`Failed to load releases: ${releaseError.message}`);

  return {
    artists: (artists ?? []) as CatalogIndex['artists'],
    releases: (releases ?? []) as CatalogIndex['releases'],
  };
}

export async function listRadioAirplayViews(
  db: AppSupabaseClient,
  options: { limit?: number; artistId?: string; releaseId?: string; stationId?: string } | number = 200
): Promise<AirplayEventView[]> {
  const opts = typeof options === 'number' ? { limit: options } : options;
  const limit = opts.limit ?? 200;
  let query = db
    .from('airplay_events')
    .select('*')
    .eq('source', 'radio')
    .order('observedAt', { ascending: false })
    .limit(limit);
  if (opts.artistId) query = query.eq('artistId', opts.artistId);
  if (opts.releaseId) query = query.eq('releaseId', opts.releaseId);
  if (opts.stationId) query = query.eq('sourceStationId', opts.stationId);
  const { data: events, error } = await query;
  if (error) throw new Error(`Failed to list airplay events: ${error.message}`);

  const rows = (events ?? []) as EventRow[];
  const stationIds = [...new Set(rows.map((row) => row.sourceStationId).filter(Boolean))] as string[];
  const artistIds = [...new Set(rows.map((row) => row.artistId).filter(Boolean))] as string[];
  const releaseIds = [...new Set(rows.map((row) => row.releaseId).filter(Boolean))] as string[];

  const stationsById = new Map<string, { name: string; country: string | null }>();
  if (stationIds.length > 0) {
    const { data: stations } = await db
      .from('radio_stations')
      .select('id, name, country')
      .in('id', stationIds);
    for (const station of stations ?? []) {
      stationsById.set(station.id, { name: station.name, country: station.country });
    }
  }

  const artistsById = new Map<string, string>();
  if (artistIds.length > 0) {
    const { data: artists } = await db.from('artists').select('id, name').in('id', artistIds);
    for (const artist of artists ?? []) {
      artistsById.set(artist.id, artist.name);
    }
  }

  const releasesById = new Map<string, string>();
  if (releaseIds.length > 0) {
    const { data: releases } = await db.from('releases').select('id, title').in('id', releaseIds);
    for (const release of releases ?? []) {
      releasesById.set(release.id, release.title);
    }
  }

  return rows.map((row) => {
    const station = row.sourceStationId ? stationsById.get(row.sourceStationId) : undefined;
    return {
      artistId: row.artistId,
      artistName: row.artistId ? artistsById.get(row.artistId) ?? null : null,
      releaseId: row.releaseId,
      releaseTitle: row.releaseId ? releasesById.get(row.releaseId) ?? null : null,
      sourceStationId: row.sourceStationId,
      stationName: station?.name ?? row.sourceLabel,
      country: station?.country ?? null,
      confidence: row.confidence,
      observedAt: row.observedAt,
      rawTitle: row.rawTitle,
      rawArtist: row.rawArtist,
      detectionMethod: row.detectionMethod,
    };
  });
}

export function isHeartbeatStale(seenAt: string | null | undefined, now = new Date()): boolean {
  if (!seenAt) return true;
  return now.getTime() - Date.parse(seenAt) > 2 * 60_000;
}
