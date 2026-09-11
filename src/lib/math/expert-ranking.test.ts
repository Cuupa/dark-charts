import { describe, it, expect } from 'vitest';
import {
  calculateExpertPoints,
  shrinkExpertScore,
  shrinkExpertScores,
  EXPERT_PRIOR_STRENGTH,
} from './expert-ranking';

describe('calculateExpertPoints', () => {
  it('applies minimum reputation of 1', () => {
    expect(calculateExpertPoints(1, 0)).toBe(10);
    expect(calculateExpertPoints(1, -5)).toBe(10);
  });

  it('scales by reputation score', () => {
    expect(calculateExpertPoints(1, 2)).toBe(20);
    expect(calculateExpertPoints(5, 1.5)).toBe(3);
  });

  it('returns correct base points per rank', () => {
    expect(calculateExpertPoints(1, 1)).toBe(10);
    expect(calculateExpertPoints(2, 1)).toBe(8);
    expect(calculateExpertPoints(3, 1)).toBe(6);
    expect(calculateExpertPoints(10, 1)).toBe(1);
  });
});

describe('shrinkExpertScore', () => {
  it('pulls a single-vote outlier toward the prior', () => {
    const shrunk = shrinkExpertScore(10, 1, 5, 5);
    expect(shrunk).toBeCloseTo((1 / 6) * 10 + (5 / 6) * 5);
    expect(shrunk).toBeLessThan(10);
  });

  it('keeps a well-supported score closer to the empirical value', () => {
    const thin = shrinkExpertScore(10, 1, 5, 5);
    const thick = shrinkExpertScore(10, 20, 5, 5);
    expect(thick).toBeGreaterThan(thin);
    expect(thick).toBeCloseTo((20 / 25) * 10 + (5 / 25) * 5);
  });
});

describe('shrinkExpertScores', () => {
  it('ranks a broad consensus above a single high score', () => {
    const result = shrinkExpertScores([
      { releaseId: 'one-dj', rawScore: 10, voteCount: 1 },
      { releaseId: 'many-djs', rawScore: 80, voteCount: 10 },
    ]);
    const one = result.find((row) => row.releaseId === 'one-dj')?.score ?? 0;
    const many = result.find((row) => row.releaseId === 'many-djs')?.score ?? 0;
    expect(many).toBeGreaterThan(one);
  });

  it('returns an empty list unchanged', () => {
    expect(shrinkExpertScores([])).toEqual([]);
  });

  it('uses a prior strength of 5', () => {
    expect(EXPERT_PRIOR_STRENGTH).toBe(5);
  });
});
