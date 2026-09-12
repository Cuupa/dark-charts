import type { DiscoveredStation, DiscoveryOptions } from './types';

const RADIO_BROWSER_SEARCH = 'https://de1.api.radio-browser.info/json/stations/search';

export async function searchRadioBrowser(
  tags: string[],
  limit: number,
  options: DiscoveryOptions
): Promise<DiscoveredStation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const perTag = Math.max(1, Math.ceil(limit / Math.max(tags.length, 1)));
  const byId = new Map<string, DiscoveredStation>();

  for (const tag of tags) {
    const url = new URL(RADIO_BROWSER_SEARCH);
    url.searchParams.set('tag', tag);
    url.searchParams.set('hidebroken', 'true');
    url.searchParams.set('limit', String(perTag));
    const res = await fetchImpl(url.toString(), {
      headers: { 'User-Agent': options.userAgent, Accept: 'application/json' },
    });
    if (!res.ok) continue;
    const payload: unknown = await res.json();
    if (!Array.isArray(payload)) continue;
    for (const row of payload) {
      const mapped = mapRow(row);
      if (mapped) byId.set(mapped.externalId, mapped);
    }
  }

  return [...byId.values()].slice(0, limit);
}

function mapRow(row: unknown): DiscoveredStation | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const record = row as Record<string, unknown>;
  const streamUrl =
    (typeof record.url_resolved === 'string' && record.url_resolved) ||
    (typeof record.url === 'string' && record.url) ||
    '';
  const externalId = typeof record.stationuuid === 'string' ? record.stationuuid : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!streamUrl.startsWith('http') || !externalId || !name) return null;
  const tags =
    typeof record.tags === 'string'
      ? record.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];
  return {
    name,
    streamUrl,
    homepageUrl: typeof record.homepage === 'string' && record.homepage ? record.homepage : null,
    country: typeof record.countrycode === 'string' && record.countrycode ? record.countrycode : null,
    tags,
    bitrate: typeof record.bitrate === 'number' ? record.bitrate : null,
    codec: typeof record.codec === 'string' ? record.codec : null,
    externalId,
    discoverySource: 'radio_browser',
  };
}
