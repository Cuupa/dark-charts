import type { DiscoveredStation, DiscoveryOptions } from './types';

export interface ShoutcastDiscoveryOptions extends DiscoveryOptions {
  apiKey: string;
}

export function parseShoutcastGenreXml(xml: string, ypBase: string): DiscoveredStation[] {
  const tunein = /<tunein[^>]*base="([^"]+)"/i.exec(xml)?.[1] ?? '/sbin/tunein-station.pls';
  const stations: DiscoveredStation[] = [];
  const stationRe = /<station\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null = stationRe.exec(xml);
  while (match) {
    const attrs = match[1] ?? '';
    const name = attr(attrs, 'name');
    const id = attr(attrs, 'id');
    const br = Number.parseInt(attr(attrs, 'br') ?? '', 10);
    const genre = attr(attrs, 'genre');
    const mime = attr(attrs, 'mt') ?? '';
    if (name && id) {
      stations.push({
        name,
        streamUrl: `${ypBase}${tunein}?id=${encodeURIComponent(id)}`,
        homepageUrl: null,
        country: null,
        tags: genre ? [genre] : [],
        bitrate: Number.isFinite(br) ? br : null,
        codec: mime.includes('mpeg') ? 'mp3' : null,
        externalId: id,
        discoverySource: 'shoutcast',
      });
    }
    match = stationRe.exec(xml);
  }
  return stations;
}

export async function searchShoutcastDirectory(
  tags: string[],
  limit: number,
  options: ShoutcastDiscoveryOptions
): Promise<DiscoveredStation[]> {
  if (!options.apiKey) return [];
  const fetchImpl = options.fetchImpl ?? fetch;
  const byId = new Map<string, DiscoveredStation>();
  for (const tag of tags) {
    const url = `https://api.shoutcast.com/legacy/genresearch?k=${encodeURIComponent(options.apiKey)}&genre=${encodeURIComponent(tag)}`;
    const res = await fetchImpl(url, { headers: { 'User-Agent': options.userAgent } });
    if (!res.ok) continue;
    const xml = await res.text();
    for (const station of parseShoutcastGenreXml(xml, 'https://yp.shoutcast.com')) {
      byId.set(station.externalId, station);
    }
  }
  return [...byId.values()].slice(0, limit);
}

function attr(source: string, name: string): string | null {
  const match = new RegExp(`${name}="([^"]*)"`, 'i').exec(source);
  return match?.[1] ?? null;
}
