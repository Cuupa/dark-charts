import { describe, expect, it } from 'vitest';
import { buildIdempotencyKey } from './dedup';

describe('buildIdempotencyKey', () => {
  it('uses the same key for the same title inside the window', () => {
    const windowMs = 30 * 60_000;
    const first = new Date(windowMs * 100);
    const second = new Date(windowMs * 100 + 5 * 60_000);
    expect(
      buildIdempotencyKey('st1', 'neuroklast', 'godslayer', first, 30)
    ).toBe(buildIdempotencyKey('st1', 'neuroklast', 'godslayer', second, 30));
  });

  it('changes the key when the title changes', () => {
    const at = new Date(0);
    expect(buildIdempotencyKey('st1', 'neuroklast', 'godslayer', at, 30)).not.toBe(
      buildIdempotencyKey('st1', 'neuroklast', 'other', at, 30)
    );
  });

  it('changes the key after the window rolls', () => {
    const windowMs = 30 * 60_000;
    const first = new Date(windowMs * 100);
    const later = new Date(windowMs * 100 + 31 * 60_000);
    expect(
      buildIdempotencyKey('st1', 'neuroklast', 'godslayer', first, 30)
    ).not.toBe(buildIdempotencyKey('st1', 'neuroklast', 'godslayer', later, 30));
  });
});
