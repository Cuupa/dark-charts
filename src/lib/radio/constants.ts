import { z } from 'zod';

export const RADIO_STATION_HEALTH_STATUSES = [
  'unknown',
  'ok',
  'dead',
  'geo_blocked',
  'no_metadata',
  'url_changed',
  'blocked',
] as const;

export type RadioStationHealthStatus = (typeof RADIO_STATION_HEALTH_STATUSES)[number];

export const RADIO_DISCOVERY_SOURCES = [
  'manual',
  'radio_browser',
  'shoutcast',
  'icecast',
  'website',
] as const;

export type RadioDiscoverySource = (typeof RADIO_DISCOVERY_SOURCES)[number];

export const RADIO_METADATA_MODES = [
  'auto',
  'icy',
  'shoutcast_stats',
  'icecast_json',
  'nowplaying_url',
] as const;

export type RadioMetadataMode = (typeof RADIO_METADATA_MODES)[number];

export const AIRPLAY_DETECTION_METHODS = [
  'icy',
  'shoutcast_stats',
  'icecast_json',
  'nowplaying_url',
  'fingerprint',
] as const;

export type AirplayDetectionMethod = (typeof AIRPLAY_DETECTION_METHODS)[number];

export const DEFAULT_RADIO_GENRE_TAGS = [
  'gothic',
  'goth',
  'darkwave',
  'dark wave',
  'industrial',
  'ebm',
  'dark electro',
  'aggrotech',
  'futurepop',
  'neofolk',
  'black metal',
  'death metal',
  'doom metal',
  'gothic metal',
  'synthpop',
] as const;

export const DEFAULT_RADIO_MONITOR_USER_AGENT =
  'DarkCharts-RadioMonitor/1.0 (+https://dark-charts.com/methodology)';

export const radioMonitorSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  maxConcurrentProbes: z.number().int().min(1).max(32).default(8),
  defaultProbeIntervalSeconds: z.number().int().min(15).max(600).default(45),
  maxMonitoredStations: z.number().int().min(1).max(1000).default(300),
  minMatchConfidence: z.number().min(0.5).max(1).default(0.85),
  dedupWindowMinutes: z.number().int().min(5).max(180).default(30),
  genreTags: z.array(z.string().min(1)).default([...DEFAULT_RADIO_GENRE_TAGS]),
  userAgent: z.string().min(8).max(200).default(DEFAULT_RADIO_MONITOR_USER_AGENT),
  discoverRadioBrowser: z.boolean().default(true),
  discoverShoutcast: z.boolean().default(false),
});

export type RadioMonitorSettings = z.infer<typeof radioMonitorSettingsSchema>;

export const DEFAULT_RADIO_MONITOR_SETTINGS: RadioMonitorSettings =
  radioMonitorSettingsSchema.parse({});

export function parseRadioMonitorSettings(value: unknown): RadioMonitorSettings {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return radioMonitorSettingsSchema.parse(raw);
}
