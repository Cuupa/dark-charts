import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_RADIO_MONITOR_SETTINGS } from './constants';
import { runWorkerTick, type WorkerStation, type WorkerTickDeps } from './workerTick';

const station: WorkerStation = {
  id: 'st1',
  name: 'Gothic Radio',
  streamUrl: 'http://radio.example/stream',
  nowPlayingUrl: null,
  metadataMode: 'auto',
  monitorEnabled: true,
  legalHold: false,
  lastProbeAt: null,
  priority: 0,
  probeIntervalSeconds: 45,
  consecutiveFailures: 0,
};

function deps(overrides: Partial<WorkerTickDeps> = {}): WorkerTickDeps {
  return {
    settings: { ...DEFAULT_RADIO_MONITOR_SETTINGS, enabled: true },
    featureEnabled: true,
    now: new Date('2026-09-11T18:00:00Z'),
    stations: [station],
    catalog: {
      artists: [{ id: 'a1', name: 'NEUROKLAST' }],
      releases: [{ id: 'r1', artistId: 'a1', title: 'GODSLAYER' }],
    },
    probe: vi.fn(async () => ({
      ok: true as const,
      streamTitle: 'NEUROKLAST - GODSLAYER',
      method: 'icy' as const,
      streamHost: 'radio.example',
    })),
    insertEvent: vi.fn(async () => 'inserted' as const),
    markProbed: vi.fn(async () => undefined),
    heartbeat: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('runWorkerTick', () => {
  it('heartbeats and skips probes when the monitor is disabled', async () => {
    const tick = deps({
      settings: { ...DEFAULT_RADIO_MONITOR_SETTINGS, enabled: false },
    });
    const result = await runWorkerTick(tick);
    expect(result).toEqual({ probed: 0, events: 0, errors: 0 });
    expect(tick.probe).not.toHaveBeenCalled();
    expect(tick.heartbeat).toHaveBeenCalled();
  });

  it('inserts a matched airplay event from a successful probe', async () => {
    const tick = deps();
    const result = await runWorkerTick(tick);
    expect(result.probed).toBe(1);
    expect(result.events).toBe(1);
    expect(tick.insertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'radio',
        sourceStationId: 'st1',
        artistId: 'a1',
        releaseId: 'r1',
        detectionMethod: 'icy',
        confidence: 1,
        rawArtist: 'NEUROKLAST',
        rawTitle: 'GODSLAYER',
      })
    );
    expect(tick.markProbed).toHaveBeenCalledWith(
      'st1',
      expect.objectContaining({ healthStatus: 'ok', consecutiveFailures: 0 })
    );
  });

  it('marks a station blocked on HTTP 403 and does not insert', async () => {
    const tick = deps({
      probe: vi.fn(async () => ({
        ok: false as const,
        health: 'blocked' as const,
        error: 'HTTP 403',
      })),
    });
    const result = await runWorkerTick(tick);
    expect(result.events).toBe(0);
    expect(result.errors).toBe(1);
    expect(tick.insertEvent).not.toHaveBeenCalled();
    expect(tick.markProbed).toHaveBeenCalledWith(
      'st1',
      expect.objectContaining({ healthStatus: 'blocked', lastError: 'HTTP 403' })
    );
  });

  it('ignores duplicate idempotency keys', async () => {
    const tick = deps({
      insertEvent: vi.fn(async () => 'duplicate' as const),
    });
    const result = await runWorkerTick(tick);
    expect(result.probed).toBe(1);
    expect(result.events).toBe(0);
  });
});
