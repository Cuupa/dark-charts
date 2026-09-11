import { describe, it, expect } from 'vitest';
import {
  VOTING_ELIGIBILITY_MONTHS,
  getVotingEligibilityCutoff,
  isReleaseEligibleForVoting,
} from './voting-eligibility';

describe('voting eligibility', () => {
  const now = new Date('2026-09-11T12:00:00.000Z');

  it('uses a 12-month window', () => {
    expect(VOTING_ELIGIBILITY_MONTHS).toBe(12);
  });

  it('cutoff is 12 months before now at UTC midnight', () => {
    const cutoff = getVotingEligibilityCutoff(now);
    expect(cutoff.toISOString()).toBe('2025-09-11T00:00:00.000Z');
  });

  it('accepts releases on or after the cutoff', () => {
    expect(isReleaseEligibleForVoting('2025-09-11', now)).toBe(true);
    expect(isReleaseEligibleForVoting('2026-01-01', now)).toBe(true);
  });

  it('rejects releases older than the window', () => {
    expect(isReleaseEligibleForVoting('2025-09-10', now)).toBe(false);
    expect(isReleaseEligibleForVoting('2019-01-01', now)).toBe(false);
  });

  it('rejects missing dates', () => {
    expect(isReleaseEligibleForVoting(null, now)).toBe(false);
    expect(isReleaseEligibleForVoting(undefined, now)).toBe(false);
  });
});
