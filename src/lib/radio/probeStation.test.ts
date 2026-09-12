import { describe, expect, it, vi } from 'vitest';
import { probeStation } from './probeStation';

const station = {
  streamUrl: 'http://radio.example:8000/stream',
  nowPlayingUrl: null as string | null,
  metadataMode: 'auto' as const,
};

describe('probeStation', () => {
  it('treats HTTP 403 as blocked', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 }));
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({
      ok: false,
      health: 'blocked',
      error: 'HTTP 403',
    });
  });

  it('treats HTTP 404 as dead', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.health).toBe('dead');
  });

  it('reads a SHOUTcast 7.html song title', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/7.html')) {
        return new Response('<HTML><body>1,1,1,50,1,128,NEUROKLAST - GODSLAYER</body></HTML>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return new Response('', { status: 404 });
    });
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'NEUROKLAST - GODSLAYER',
      method: 'shoutcast_stats',
      streamHost: 'radio.example',
    });
  });

  it('reads Icecast status-json title', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('status-json.xsl')) {
        return new Response(
          JSON.stringify({
            icestats: { source: { title: 'Artist - Song' } },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('', { status: 404 });
    });
    const result = await probeStation(
      { ...station, metadataMode: 'icecast_json' },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'Artist - Song',
      method: 'icecast_json',
    });
  });

  it('reads nowPlayingUrl JSON artist and title', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ artist: 'NEUROKLAST', title: 'GODSLAYER' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    const result = await probeStation(
      {
        streamUrl: 'http://radio.example:8000/stream',
        nowPlayingUrl: 'http://radio.example/now.json',
        metadataMode: 'nowplaying_url',
      },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'NEUROKLAST - GODSLAYER',
      method: 'nowplaying_url',
    });
  });

  it('fails when no stream URL is configured', async () => {
    const result = await probeStation(
      { streamUrl: null, nowPlayingUrl: null, metadataMode: 'auto' },
      { userAgent: 'test-agent', fetchImpl: vi.fn() as unknown as typeof fetch }
    );
    expect(result).toEqual({ ok: false, health: 'dead', error: 'Missing stream URL' });
  });
});
