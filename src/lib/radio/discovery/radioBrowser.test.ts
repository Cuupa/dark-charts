import { describe, expect, it, vi } from 'vitest';
import { searchRadioBrowser } from './radioBrowser';

describe('searchRadioBrowser', () => {
  it('maps directory rows to candidates and skips empty stream URLs', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            name: 'Gothic Radio',
            url: 'http://radio.example/stream',
            url_resolved: 'http://radio.example/stream',
            homepage: 'http://radio.example',
            countrycode: 'DE',
            tags: 'gothic,industrial',
            bitrate: 128,
            codec: 'mp3',
            stationuuid: 'uuid-1',
          },
          {
            name: 'Broken',
            url: '',
            url_resolved: '',
            stationuuid: 'uuid-2',
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const found = await searchRadioBrowser(['gothic'], 50, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      userAgent: 'test-agent',
    });

    expect(found).toEqual([
      {
        name: 'Gothic Radio',
        streamUrl: 'http://radio.example/stream',
        homepageUrl: 'http://radio.example',
        country: 'DE',
        tags: ['gothic', 'industrial'],
        bitrate: 128,
        codec: 'mp3',
        externalId: 'uuid-1',
        discoverySource: 'radio_browser',
      },
    ]);
  });
});
