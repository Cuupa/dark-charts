import { describe, it, expect } from 'vitest';
import {
  nextReputationScore,
  REPUTATION_MIN,
  REPUTATION_MAX,
} from './expert-reputation';

describe('nextReputationScore', () => {
  it('moves toward 1 when none of the ballot hit the later fan chart', () => {
    const next = nextReputationScore(2, 0, 10);
    expect(next).toBeGreaterThanOrEqual(REPUTATION_MIN);
    expect(next).toBeLessThan(2);
  });

  it('moves toward the max when the full ballot later charts', () => {
    const next = nextReputationScore(1, 10, 10);
    expect(next).toBeGreaterThan(1);
    expect(next).toBeLessThanOrEqual(REPUTATION_MAX);
  });

  it('clamps to the reputation band', () => {
    expect(nextReputationScore(3, 10, 10)).toBeLessThanOrEqual(REPUTATION_MAX);
    expect(nextReputationScore(1, 0, 10)).toBeGreaterThanOrEqual(REPUTATION_MIN);
  });
});
