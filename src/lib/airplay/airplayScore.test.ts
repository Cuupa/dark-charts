import { describe, it, expect } from 'vitest';
import { airplayVolume, calculateAirplayScore } from './airplayScore';
import type { AirplayVolume } from './types';

const empty: AirplayVolume = {
  playlistAddCount: 0,
  playlistReach: 0,
  radioSpinCount: 0,
  radioStationCount: 0,
  djSpinCount: 0,
  totalReach: 0,
};

describe('airplayVolume', () => {
  it('weights playlist adds above dj spins above radio spins', () => {
    expect(airplayVolume({ ...empty, playlistAddCount: 1 })).toBe(3);
    expect(airplayVolume({ ...empty, djSpinCount: 1 })).toBe(2);
    expect(airplayVolume({ ...empty, radioSpinCount: 1 })).toBe(1);
  });
});

describe('calculateAirplayScore', () => {
  it('returns 0 when there is no airplay volume', () => {
    expect(calculateAirplayScore(empty, null)).toBe(0);
    expect(calculateAirplayScore({ ...empty, totalReach: 100000 }, null)).toBe(0);
  });

  it('rewards more airplay with a higher score', () => {
    const small = calculateAirplayScore({ ...empty, radioSpinCount: 2 }, null);
    const large = calculateAirplayScore({ ...empty, radioSpinCount: 50 }, null);
    expect(large).toBeGreaterThan(small);
  });

  it('rewards larger reach for equal volume', () => {
    const base = { ...empty, playlistAddCount: 5 };
    const lowReach = calculateAirplayScore({ ...base, totalReach: 100 }, null);
    const highReach = calculateAirplayScore({ ...base, totalReach: 1_000_000 }, null);
    expect(highReach).toBeGreaterThan(lowReach);
  });

  it('boosts week-over-week growth and dampens decline', () => {
    const current = { ...empty, radioSpinCount: 20 };
    const flat = calculateAirplayScore(current, current);
    const growing = calculateAirplayScore(current, { ...empty, radioSpinCount: 5 });
    const declining = calculateAirplayScore(current, { ...empty, radioSpinCount: 80 });
    expect(growing).toBeGreaterThan(flat);
    expect(declining).toBeLessThan(flat);
  });
});
