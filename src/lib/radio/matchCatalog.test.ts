import { describe, expect, it } from 'vitest';
import { matchCatalog, type CatalogIndex } from './matchCatalog';

const catalog: CatalogIndex = {
  artists: [
    { id: 'a1', name: 'NEUROKLAST' },
    { id: 'a2', name: 'The Sisters of Mercy' },
  ],
  releases: [
    { id: 'r1', artistId: 'a1', title: 'GODSLAYER' },
    { id: 'r2', artistId: 'a2', title: 'Floodland' },
  ],
};

describe('matchCatalog', () => {
  it('matches exact artist and title at confidence 1', () => {
    expect(matchCatalog({ artist: 'NEUROKLAST', title: 'GODSLAYER' }, catalog)).toEqual({
      artistId: 'a1',
      releaseId: 'r1',
      confidence: 1,
    });
  });

  it('matches an exact artist with a high-similarity title', () => {
    const match = matchCatalog({ artist: 'NEUROKLAST', title: 'GODSLAYERR' }, catalog);
    expect(match?.artistId).toBe('a1');
    expect(match?.releaseId).toBe('r1');
    expect(match?.confidence).toBe(0.92);
  });

  it('rejects a weak artist match even if the title is close', () => {
    expect(matchCatalog({ artist: 'Metal Radio', title: 'GODSLAYER' }, catalog)).toBeNull();
  });

  it('normalizes featuring and remix tokens before matching', () => {
    expect(
      matchCatalog({ artist: 'NEUROKLAST feat. X', title: 'GODSLAYER (Club Remix)' }, catalog)
    ).toEqual({
      artistId: 'a1',
      releaseId: 'r1',
      confidence: 1,
    });
  });
});
