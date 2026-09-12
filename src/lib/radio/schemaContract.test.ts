import { describe, expect, it } from 'vitest';
import {
  AIRPLAY_DETECTION_METHODS,
  RADIO_DISCOVERY_SOURCES,
  RADIO_METADATA_MODES,
  RADIO_STATION_HEALTH_STATUSES,
  radioMonitorSettingsSchema,
} from './constants';

describe('radio monitor schema contract', () => {
  it('lists every station health status the probe can write', () => {
    expect([...RADIO_STATION_HEALTH_STATUSES].sort()).toEqual(
      ['blocked', 'dead', 'geo_blocked', 'no_metadata', 'ok', 'unknown', 'url_changed'].sort()
    );
  });

  it('lists discovery sources including manual add', () => {
    expect(RADIO_DISCOVERY_SOURCES).toContain('manual');
    expect(RADIO_DISCOVERY_SOURCES).toContain('radio_browser');
    expect(RADIO_DISCOVERY_SOURCES).toContain('shoutcast');
  });

  it('reserves fingerprint as a detection method without enabling it', () => {
    expect(AIRPLAY_DETECTION_METHODS).toContain('fingerprint');
    expect(AIRPLAY_DETECTION_METHODS).toContain('icy');
  });

  it('defaults monitor settings to off with a 300-station cap', () => {
    const parsed = radioMonitorSettingsSchema.parse({});
    expect(parsed.enabled).toBe(false);
    expect(parsed.maxMonitoredStations).toBe(300);
    expect(parsed.maxConcurrentProbes).toBe(8);
    expect(parsed.defaultProbeIntervalSeconds).toBe(45);
    expect(parsed.minMatchConfidence).toBe(0.85);
    expect(parsed.dedupWindowMinutes).toBe(30);
    expect(parsed.discoverRadioBrowser).toBe(true);
    expect(parsed.discoverShoutcast).toBe(false);
  });

  it('rejects a station cap above 1000', () => {
    const result = radioMonitorSettingsSchema.safeParse({ maxMonitoredStations: 1001 });
    expect(result.success).toBe(false);
  });

  it('includes auto metadata mode for probe fallback', () => {
    expect(RADIO_METADATA_MODES).toContain('auto');
    expect(RADIO_METADATA_MODES).toContain('icy');
  });
});
