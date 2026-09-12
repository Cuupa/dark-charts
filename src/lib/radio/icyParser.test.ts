import { describe, expect, it } from 'vitest';
import { extractIcyStreamTitle } from './icyParser';

function buildIcyPayload(metaint: number, title: string): Uint8Array {
  const audio = new Uint8Array(metaint);
  const body = `StreamTitle='${title}';StreamUrl='';`;
  const padded = Math.ceil(body.length / 16) * 16;
  const meta = new Uint8Array(1 + padded);
  meta[0] = padded / 16;
  new TextEncoder().encodeInto(body, meta.subarray(1));
  const out = new Uint8Array(audio.length + meta.length);
  out.set(audio, 0);
  out.set(meta, audio.length);
  return out;
}

describe('extractIcyStreamTitle', () => {
  it('reads StreamTitle after the metaint audio bytes', () => {
    const bytes = buildIcyPayload(16, 'NEUROKLAST - GODSLAYER');
    expect(extractIcyStreamTitle(bytes, 16)).toBe('NEUROKLAST - GODSLAYER');
  });

  it('returns null when the buffer is shorter than metaint', () => {
    expect(extractIcyStreamTitle(new Uint8Array(8), 16)).toBeNull();
  });

  it('returns null when the metadata length is zero', () => {
    const bytes = new Uint8Array(17);
    expect(extractIcyStreamTitle(bytes, 16)).toBeNull();
  });
});
