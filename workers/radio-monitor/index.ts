import { createClient } from '@supabase/supabase-js';
import { mergeFeatureFlags } from '@/config/featureFlags';
import { GLOBAL_SETTINGS_ID } from '@/lib/api/systemSettings';
import { logger } from '@/lib/logger';
import { parseRadioMonitorSettings } from '@/lib/radio/constants';
import { probeStation } from '@/lib/radio/probeStation';
import {
  insertAirplayEvent,
  listWorkerStations,
  loadCatalogIndex,
  markStationProbed,
  touchHeartbeat,
} from '@/lib/radio/stationRepository';
import type { CatalogIndex } from '@/lib/radio/matchCatalog';
import { runWorkerTick } from '@/lib/radio/workerTick';
import type { AppSupabaseClient } from '@/types/supabase-client';

const TICK_MS = 5_000;
const CATALOG_TTL_MS = 10 * 60_000;
const WORKER_VERSION = 'radio-monitor-1';

function createWorkerDb(): AppSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as AppSupabaseClient;
}

async function loadFlagsAndSettings(db: AppSupabaseClient) {
  const { data, error } = await db
    .from('system_settings')
    .select('featureFlags, radioMonitor')
    .eq('id', GLOBAL_SETTINGS_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const flags = mergeFeatureFlags(
    data?.featureFlags && typeof data.featureFlags === 'object' && !Array.isArray(data.featureFlags)
      ? (data.featureFlags as Record<string, unknown>)
      : {}
  );
  return {
    featureEnabled: flags.radioMonitorEnabled,
    settings: parseRadioMonitorSettings(data?.radioMonitor),
  };
}

async function main(): Promise<void> {
  const db = createWorkerDb();
  let catalogAt = 0;
  let catalog: CatalogIndex = { artists: [], releases: [] };

  logger.info('Radio monitor worker started', { version: WORKER_VERSION });

  for (;;) {
    try {
      const { featureEnabled, settings } = await loadFlagsAndSettings(db);
      if (Date.now() - catalogAt > CATALOG_TTL_MS) {
        catalog = await loadCatalogIndex(db);
        catalogAt = Date.now();
      }
      const stations = await listWorkerStations(db);
      const result = await runWorkerTick({
        settings,
        featureEnabled,
        now: new Date(),
        stations,
        catalog,
        probe: (station) =>
          probeStation(
            {
              streamUrl: station.streamUrl,
              nowPlayingUrl: station.nowPlayingUrl,
              metadataMode: station.metadataMode,
            },
            { userAgent: settings.userAgent }
          ),
        insertEvent: (event) => insertAirplayEvent(db, event),
        markProbed: (id, patch) => markStationProbed(db, id, patch),
        heartbeat: (payload) =>
          touchHeartbeat(db, { ...payload, workerVersion: WORKER_VERSION }),
      });
      if (result.probed > 0) {
        logger.info('Radio monitor tick', result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown worker error';
      logger.error('Radio monitor tick failed', { error: message });
      try {
        await touchHeartbeat(db, {
          seenAt: new Date().toISOString(),
          probesLastMinute: 0,
          error: message,
          workerVersion: WORKER_VERSION,
        });
      } catch {
        // Heartbeat write failed; the next loop retries.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, TICK_MS));
  }
}

void main();
