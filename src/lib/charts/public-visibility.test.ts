import { describe, expect, it } from 'vitest';
import { filterPublicChartEntries, isPublicChartRelease } from './public-visibility';

describe('public chart visibility', () => {
  it('hides missing, hidden, or artist-hidden releases', () => {
    expect(isPublicChartRelease(null)).toBe(false);
    expect(isPublicChartRelease({ isVisible: false })).toBe(false);
    expect(isPublicChartRelease({ isVisible: true, artist: { isVisible: false } })).toBe(
      false
    );
  });

  it('keeps visible releases, including rows that omitted the flag', () => {
    expect(isPublicChartRelease({ isVisible: true })).toBe(true);
    expect(isPublicChartRelease({})).toBe(true);
    expect(isPublicChartRelease({ isVisible: true, artist: { isVisible: true } })).toBe(
      true
    );
  });

  it('drops hidden rows from a public chart payload', () => {
    const visible = filterPublicChartEntries([
      { id: 'keep', release: { isVisible: true, artist: { isVisible: true } } },
      { id: 'hidden-release', release: { isVisible: false, artist: { isVisible: true } } },
      { id: 'hidden-artist', release: { isVisible: true, artist: { isVisible: false } } },
      { id: 'orphan', release: null },
    ]);

    expect(visible.map((row) => row.id)).toEqual(['keep']);
  });
});
