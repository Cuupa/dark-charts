import { describe, expect, it } from 'vitest';
import { filterTracksByMainGenre, trackMatchesMainGenre } from './genre-filter';
import type { Track } from '@/types';

function track(partial: Partial<Track> & Pick<Track, 'id' | 'genres'>): Track {
  return {
    rank: 1,
    artist: 'A',
    title: 'T',
    chartType: 'fan',
    ...partial,
  };
}

describe('trackMatchesMainGenre', () => {
  it('matches a subgenre of Metal', () => {
    expect(trackMatchesMainGenre(track({ id: '1', genres: ['Doom Metal'] }), 'Metal')).toBe(true);
  });

  it('does not match Gothic tags as Metal', () => {
    expect(trackMatchesMainGenre(track({ id: '1', genres: ['Dark Wave'] }), 'Metal')).toBe(false);
  });
});

describe('filterTracksByMainGenre', () => {
  it('returns all tracks when genre is null', () => {
    const tracks = [track({ id: '1', genres: ['Doom Metal'], rank: 3 })];
    expect(filterTracksByMainGenre(tracks, null)).toEqual(tracks);
  });

  it('filters and re-ranks', () => {
    const tracks = [
      track({ id: '1', genres: ['Dark Wave'], rank: 1 }),
      track({ id: '2', genres: ['Doom Metal'], rank: 2 }),
      track({ id: '3', genres: ['Gothic Metal'], rank: 3 }),
    ];
    const metal = filterTracksByMainGenre(tracks, 'Metal');
    expect(metal.map((item) => item.id)).toEqual(['2', '3']);
    expect(metal.map((item) => item.rank)).toEqual([1, 2]);
  });
});
