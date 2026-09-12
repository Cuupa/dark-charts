export interface ProbeableStation {
  id: string;
  name: string;
  monitorEnabled: boolean;
  legalHold: boolean;
  lastProbeAt: string | null;
  priority: number;
  probeIntervalSeconds: number;
}

export function selectDueStations<T extends ProbeableStation>(
  stations: T[],
  now: Date,
  maxStations: number
): T[] {
  const nowMs = now.getTime();
  const due = stations.filter((station) => {
    if (!station.monitorEnabled || station.legalHold) return false;
    if (!station.lastProbeAt) return true;
    const intervalMs = Math.max(1, station.probeIntervalSeconds) * 1000;
    return Date.parse(station.lastProbeAt) + intervalMs <= nowMs;
  });

  due.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aTime = a.lastProbeAt ? Date.parse(a.lastProbeAt) : 0;
    const bTime = b.lastProbeAt ? Date.parse(b.lastProbeAt) : 0;
    return aTime - bTime;
  });

  return due.slice(0, Math.max(0, maxStations));
}
