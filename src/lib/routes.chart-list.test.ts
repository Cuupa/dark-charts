import { describe, expect, it } from 'vitest';
import { chartListPath, genreFromQuery } from './routes';

describe('chartListPath', () => {
  it('keeps club charts when filtering Metal', () => {
    expect(chartListPath('club', 'Metal')).toBe('/charts/club?genre=metal');
  });

  it('clears genre on Alle', () => {
    expect(chartListPath('club', null)).toBe('/charts/club');
  });

  it('uses home for overall', () => {
    expect(chartListPath('overview', 'Gothic')).toBe('/?genre=gothic');
  });
});

describe('genreFromQuery', () => {
  it('parses known slugs', () => {
    expect(genreFromQuery('dark-electro')).toBe('Dark Electro');
  });

  it('returns null for junk', () => {
    expect(genreFromQuery('jazz')).toBeNull();
  });
});
