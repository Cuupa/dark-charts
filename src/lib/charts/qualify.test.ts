import { describe, expect, it } from 'vitest';
import { qualifiesForChartPlacement, rankQualifiedItems } from './qualify';

describe('chart placement qualification', () => {
  it('rejects zero and negative scores', () => {
    expect(qualifiesForChartPlacement(0)).toBe(false);
    expect(qualifiesForChartPlacement(-1)).toBe(false);
    expect(qualifiesForChartPlacement(Number.NaN)).toBe(false);
  });

  it('accepts a strictly positive score', () => {
    expect(qualifiesForChartPlacement(0.001)).toBe(true);
    expect(qualifiesForChartPlacement(1000)).toBe(true);
  });

  it('ranks only qualifying items and compact placements from 1', () => {
    const ranked = rankQualifiedItems(
      [
        { id: 'zero', score: 0 },
        { id: 'mid', score: 4 },
        { id: 'top', score: 10 },
        { id: 'neg', score: -2 },
      ],
      (item) => item.score
    );

    expect(ranked.map((row) => row.item.id)).toEqual(['top', 'mid']);
    expect(ranked.map((row) => row.placement)).toEqual([1, 2]);
    expect(ranked[0].score).toBe(10);
  });
});
