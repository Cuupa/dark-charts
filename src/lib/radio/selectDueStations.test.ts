import { describe, expect, it } from 'vitest';
import { selectDueStations, type ProbeableStation } from './selectDueStations';

function station(overrides: Partial<ProbeableStation> & Pick<ProbeableStation, 'id'>): ProbeableStation {
  return {
    name: overrides.id,
    monitorEnabled: true,
    legalHold: false,
    lastProbeAt: null,
    priority: 0,
    probeIntervalSeconds: 45,
    ...overrides,
  };
}

describe('selectDueStations', () => {
  const now = new Date('2026-09-11T18:00:00Z');

  it('skips stations that are not enabled or on legal hold', () => {
    const due = selectDueStations(
      [
        station({ id: 'off', monitorEnabled: false }),
        station({ id: 'hold', legalHold: true }),
        station({ id: 'ok' }),
      ],
      now,
      300
    );
    expect(due.map((s) => s.id)).toEqual(['ok']);
  });

  it('skips stations probed more recently than their interval', () => {
    const due = selectDueStations(
      [
        station({
          id: 'fresh',
          lastProbeAt: '2026-09-11T17:59:30Z',
          probeIntervalSeconds: 45,
        }),
        station({
          id: 'stale',
          lastProbeAt: '2026-09-11T17:58:00Z',
          probeIntervalSeconds: 45,
        }),
      ],
      now,
      300
    );
    expect(due.map((s) => s.id)).toEqual(['stale']);
  });

  it('orders by priority then oldest probe and caps the batch', () => {
    const due = selectDueStations(
      [
        station({ id: 'low', priority: 1, lastProbeAt: '2026-09-11T12:00:00Z' }),
        station({ id: 'high-old', priority: 5, lastProbeAt: '2026-09-11T10:00:00Z' }),
        station({ id: 'high-new', priority: 5, lastProbeAt: '2026-09-11T11:00:00Z' }),
      ],
      now,
      2
    );
    expect(due.map((s) => s.id)).toEqual(['high-old', 'high-new']);
  });
});
