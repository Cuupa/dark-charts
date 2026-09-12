import { describe, expect, it } from 'vitest';
import { filterAirplayEvents, summarizeAirplay } from './airplayQuery';

const events = [
  {
    artistId: 'a1',
    artistName: 'NEUROKLAST',
    releaseId: 'r1',
    releaseTitle: 'GODSLAYER',
    sourceStationId: 's1',
    stationName: 'Gothic Radio',
    country: 'DE',
    confidence: 0.98,
    observedAt: '2026-09-03T21:14:00Z',
  },
  {
    artistId: 'a1',
    artistName: 'NEUROKLAST',
    releaseId: 'r1',
    releaseTitle: 'GODSLAYER',
    sourceStationId: 's2',
    stationName: 'EBM FM',
    country: 'NL',
    confidence: 0.9,
    observedAt: '2026-09-11T18:41:00Z',
  },
  {
    artistId: 'a1',
    artistName: 'NEUROKLAST',
    releaseId: null,
    sourceStationId: 's3',
    stationName: 'Unknown',
    country: 'BE',
    confidence: 0.4,
    observedAt: '2026-09-11T12:00:00Z',
  },
  {
    artistId: null,
    artistName: null,
    releaseId: null,
    sourceStationId: 's1',
    stationName: 'Gothic Radio',
    country: 'DE',
    confidence: 1,
    observedAt: '2026-09-11T13:00:00Z',
    rawTitle: 'DJ Mix',
  },
];

describe('summarizeAirplay', () => {
  it('counts matched spins above min confidence', () => {
    const summary = summarizeAirplay(events, { minConfidence: 0.85, artistName: 'NEUROKLAST' });
    expect(summary.spins).toBe(2);
    expect(summary.stations).toBe(2);
    expect(summary.countries).toEqual(['DE', 'NL']);
    expect(summary.firstDetected).toBe('2026-09-03T21:14:00Z');
    expect(summary.lastDetected).toBe('2026-09-11T18:41:00Z');
    expect(summary.confidence).toBeCloseTo(0.94, 2);
  });
});

describe('filterAirplayEvents', () => {
  it('filters by station, country, and date range', () => {
    const filtered = filterAirplayEvents(events, {
      stationId: 's1',
      country: 'DE',
      from: '2026-09-01T00:00:00Z',
      to: '2026-09-10T00:00:00Z',
      minConfidence: 0.85,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.sourceStationId).toBe('s1');
  });
});
