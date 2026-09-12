import { mapWithConcurrency } from '@/lib/mapWithConcurrency';
import { getWeekStartMonday } from '@/lib/week';
import type { AirplayDetectionMethod, RadioMonitorSettings, RadioStationHealthStatus } from './constants';
import { buildIdempotencyKey } from './dedup';
import { matchCatalog, type CatalogIndex } from './matchCatalog';
import { normalizeName } from './normalizeTitle';
import { parseStreamTitle } from './parseStreamTitle';
import type { ProbeResult } from './probeStation';
import { selectDueStations, type ProbeableStation } from './selectDueStations';

export interface WorkerStation extends ProbeableStation {
  streamUrl: string | null;
  nowPlayingUrl: string | null;
  metadataMode: string;
  consecutiveFailures: number;
}

export interface RadioAirplayInsert {
  source: 'radio';
  sourceStationId: string;
  sourceLabel: string;
  artistId: string | null;
  releaseId: string | null;
  rawArtist: string | null;
  rawTitle: string | null;
  detectionMethod: AirplayDetectionMethod;
  confidence: number;
  streamHost: string | null;
  idempotencyKey: string;
  observedAt: string;
  weekStart: string;
  reach: number;
  weight: number;
}

export interface StationProbePatch {
  lastProbeAt: string;
  lastMetadataAt?: string | null;
  lastError: string | null;
  healthStatus: RadioStationHealthStatus;
  consecutiveFailures: number;
}

export interface WorkerHeartbeat {
  seenAt: string;
  probesLastMinute: number;
  error: string | null;
  workerVersion?: string;
}

export interface WorkerTickDeps {
  settings: RadioMonitorSettings;
  featureEnabled: boolean;
  now: Date;
  stations: WorkerStation[];
  catalog: CatalogIndex;
  probe: (station: WorkerStation) => Promise<ProbeResult>;
  insertEvent: (event: RadioAirplayInsert) => Promise<'inserted' | 'duplicate'>;
  markProbed: (stationId: string, patch: StationProbePatch) => Promise<void>;
  heartbeat: (payload: WorkerHeartbeat) => Promise<void>;
}

const FAILURES_BEFORE_DEAD = 5;

export async function runWorkerTick(
  deps: WorkerTickDeps
): Promise<{ probed: number; events: number; errors: number }> {
  const seenAt = deps.now.toISOString();
  if (!deps.settings.enabled || !deps.featureEnabled) {
    await deps.heartbeat({ seenAt, probesLastMinute: 0, error: null });
    return { probed: 0, events: 0, errors: 0 };
  }

  const due = selectDueStations(deps.stations, deps.now, deps.settings.maxMonitoredStations);
  const batch = due.slice(0, deps.settings.maxConcurrentProbes);

  const results = await mapWithConcurrency(batch, deps.settings.maxConcurrentProbes, async (station) => {
    return probeOne(station, deps);
  });

  const probed = results.length;
  const events = results.filter((result) => result === 'inserted').length;
  const errors = results.filter((result) => result === 'error').length;

  await deps.heartbeat({
    seenAt,
    probesLastMinute: probed,
    error: errors > 0 ? `${errors} probe errors` : null,
  });

  return { probed, events, errors };
}

async function probeOne(
  station: WorkerStation,
  deps: WorkerTickDeps
): Promise<'inserted' | 'duplicate' | 'error' | 'empty'> {
  const observedAt = deps.now;
  const observedIso = observedAt.toISOString();
  const result = await deps.probe(station);

  if (!result.ok) {
    const failures = station.consecutiveFailures + 1;
    const health: RadioStationHealthStatus =
      result.health === 'blocked' || result.health === 'geo_blocked'
        ? result.health
        : failures >= FAILURES_BEFORE_DEAD
          ? 'dead'
          : result.health;
    await deps.markProbed(station.id, {
      lastProbeAt: observedIso,
      lastError: result.error,
      healthStatus: health,
      consecutiveFailures: failures,
    });
    return 'error';
  }

  const parsed = parseStreamTitle(result.streamTitle);
  const rawArtist = parsed?.artist ?? null;
  const rawTitle = parsed?.title ?? result.streamTitle;
  const match =
    parsed !== null
      ? matchCatalog(parsed, deps.catalog)
      : null;
  const normalizedArtist = normalizeName(rawArtist ?? result.streamTitle);
  const normalizedTitle = normalizeName(rawTitle);
  const confidence = match?.confidence ?? 0;
  const storeMatch = match && confidence >= deps.settings.minMatchConfidence ? match : null;

  const event: RadioAirplayInsert = {
    source: 'radio',
    sourceStationId: station.id,
    sourceLabel: station.name,
    artistId: storeMatch?.artistId ?? null,
    releaseId: storeMatch?.releaseId ?? null,
    rawArtist,
    rawTitle,
    detectionMethod: result.method,
    confidence: storeMatch?.confidence ?? 0,
    streamHost: result.streamHost,
    idempotencyKey: buildIdempotencyKey(
      station.id,
      normalizedArtist || 'unknown',
      normalizedTitle || 'unknown',
      observedAt,
      deps.settings.dedupWindowMinutes
    ),
    observedAt: observedIso,
    weekStart: getWeekStartMonday(observedAt).toISOString(),
    reach: 0,
    weight: 1,
  };

  const inserted = await deps.insertEvent(event);
  await deps.markProbed(station.id, {
    lastProbeAt: observedIso,
    lastMetadataAt: observedIso,
    lastError: null,
    healthStatus: parsed ? 'ok' : 'no_metadata',
    consecutiveFailures: 0,
  });
  return inserted;
}
