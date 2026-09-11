import { describe, it, expect } from 'vitest';
import { rollupAirplayEvents } from './rollup';
import type { AirplayEventLike } from './types';

const WEEK = '2026-08-31T00:00:00.000Z';

describe('rollupAirplayEvents', () => {
  it('aggregates events per release by source', () => {
    const events: AirplayEventLike[] = [
      { releaseId: 'r1', source: 'playlist', reach: 1000 },
      { releaseId: 'r1', source: 'playlist', reach: 500 },
      { releaseId: 'r1', source: 'radio', reach: 200, sourceStationId: 's1' },
      { releaseId: 'r1', source: 'radio', reach: 200, sourceStationId: 's1' },
      { releaseId: 'r1', source: 'radio', reach: 300, sourceStationId: 's2' },
      { releaseId: 'r1', source: 'dj' },
    ];

    const [agg] = rollupAirplayEvents(events, WEEK);

    expect(agg.releaseId).toBe('r1');
    expect(agg.weekStart).toBe(WEEK);
    expect(agg.playlistAddCount).toBe(2);
    expect(agg.playlistReach).toBe(1500);
    expect(agg.radioSpinCount).toBe(3);
    expect(agg.radioStationCount).toBe(2);
    expect(agg.djSpinCount).toBe(1);
    expect(agg.totalReach).toBe(2200);
  });

  it('separates aggregates for different releases', () => {
    const events: AirplayEventLike[] = [
      { releaseId: 'r1', source: 'radio', reach: 10, sourceStationId: 's1' },
      { releaseId: 'r2', source: 'radio', reach: 20, sourceStationId: 's1' },
    ];

    const result = rollupAirplayEvents(events, WEEK);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.releaseId === 'r2')?.totalReach).toBe(20);
  });

  it('ignores unmatched events without a releaseId', () => {
    const events: AirplayEventLike[] = [
      { releaseId: null, source: 'radio', reach: 999, sourceStationId: 's1' },
    ];
    expect(rollupAirplayEvents(events, WEEK)).toHaveLength(0);
  });

  it('treats negative reach as zero', () => {
    const [agg] = rollupAirplayEvents(
      [{ releaseId: 'r1', source: 'playlist', reach: -5 }],
      WEEK
    );
    expect(agg.totalReach).toBe(0);
    expect(agg.playlistReach).toBe(0);
  });
});
