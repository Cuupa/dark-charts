import { describe, expect, it } from 'vitest';
import { demoCatalog, getDemoCharts, getDemoRelease, getDemoArtist, DEMO_EDITION } from './catalog';

describe('coherent demo catalog', () => {
  it('resolves every release and artist from each chart pool', () => {
    for (const list of Object.values(getDemoCharts())) {
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        expect(getDemoRelease(entry.id)?.id).toBe(entry.id);
        expect(getDemoArtist(entry.artistId!)?.name).toBe(entry.artist);
      }
    }
  });
  it('is deterministic and keeps streaming separate', () => {
    expect(getDemoCharts()).toEqual(getDemoCharts());
    expect(getDemoCharts().streamingCharts).toEqual([]);
    expect(new Set(demoCatalog.map(t => t.id)).size).toBe(demoCatalog.length);
    expect(DEMO_EDITION.status).toBe('demo');
  });
});
