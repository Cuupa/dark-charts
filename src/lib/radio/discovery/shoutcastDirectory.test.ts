import { describe, expect, it } from 'vitest';
import { parseShoutcastGenreXml, searchShoutcastDirectory } from './shoutcastDirectory';

const xml = `
<stationlist>
  <tunein base="/sbin/tunein-station.pls"/>
  <station name="EBM FM" mt="audio/mpeg" id="123" br="128" genre="EBM" ct="NEUROKLAST - GODSLAYER" lc="10"/>
</stationlist>
`;

describe('parseShoutcastGenreXml', () => {
  it('extracts station rows from the legacy directory XML', () => {
    expect(parseShoutcastGenreXml(xml, 'https://yp.shoutcast.com')).toEqual([
      {
        name: 'EBM FM',
        streamUrl: 'https://yp.shoutcast.com/sbin/tunein-station.pls?id=123',
        homepageUrl: null,
        country: null,
        tags: ['EBM'],
        bitrate: 128,
        codec: 'mp3',
        externalId: '123',
        discoverySource: 'shoutcast',
      },
    ]);
  });
});

describe('searchShoutcastDirectory', () => {
  it('returns no stations when an API key is missing', async () => {
    const found = await searchShoutcastDirectory(['industrial'], 20, {
      apiKey: '',
      fetchImpl: (async () => new Response('nope')) as unknown as typeof fetch,
      userAgent: 'test',
    });
    expect(found).toEqual([]);
  });
});
