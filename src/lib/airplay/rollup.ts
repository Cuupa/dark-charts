import type { AirplayEventLike, AirplaySnapshotAggregate } from './types';
import { calculateAirplayScore } from './airplayScore';

export function rollupAirplayEvents(
  events: AirplayEventLike[],
  weekStart: string
): AirplaySnapshotAggregate[] {
  const byRelease = new Map<string, AirplaySnapshotAggregate>();
  const radioStationsByRelease = new Map<string, Set<string>>();

  const ensure = (releaseId: string): AirplaySnapshotAggregate => {
    const existing = byRelease.get(releaseId);
    if (existing) return existing;
    const fresh: AirplaySnapshotAggregate = {
      releaseId,
      weekStart,
      playlistAddCount: 0,
      playlistReach: 0,
      radioSpinCount: 0,
      radioStationCount: 0,
      djSpinCount: 0,
      totalReach: 0,
    };
    byRelease.set(releaseId, fresh);
    return fresh;
  };

  for (const event of events) {
    if (!event.releaseId) continue;
    const agg = ensure(event.releaseId);
    const reach = Math.max(0, event.reach ?? 0);
    agg.totalReach += reach;

    switch (event.source) {
      case 'playlist':
        agg.playlistAddCount += 1;
        agg.playlistReach += reach;
        break;
      case 'radio': {
        agg.radioSpinCount += 1;
        if (event.sourceStationId) {
          const stations =
            radioStationsByRelease.get(event.releaseId) ?? new Set<string>();
          stations.add(event.sourceStationId);
          radioStationsByRelease.set(event.releaseId, stations);
        }
        break;
      }
      case 'dj':
        agg.djSpinCount += 1;
        break;
      default:
        break;
    }
  }

  for (const [releaseId, stations] of radioStationsByRelease) {
    const agg = byRelease.get(releaseId);
    if (agg) agg.radioStationCount = stations.size;
  }

  return [...byRelease.values()];
}

export function scoreForAggregate(agg: AirplaySnapshotAggregate): number {
  return calculateAirplayScore(agg, null);
}
