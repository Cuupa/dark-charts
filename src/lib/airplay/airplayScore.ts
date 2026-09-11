import type { AirplayVolume } from './types';

export const AIRPLAY_SOURCE_WEIGHTS = {
  radioSpin: 1,
  playlistAdd: 3,
  djSpin: 2,
} as const;

export function airplayVolume(v: AirplayVolume): number {
  return (
    v.radioSpinCount * AIRPLAY_SOURCE_WEIGHTS.radioSpin +
    v.playlistAddCount * AIRPLAY_SOURCE_WEIGHTS.playlistAdd +
    v.djSpinCount * AIRPLAY_SOURCE_WEIGHTS.djSpin
  );
}

function growthFactor(current: number, previous: number): number {
  if (previous <= 0) return 1.0;
  const growth = ((current - previous) / previous) * 100;
  if (growth < 0) return Math.max(0.5, 1 + growth / 100);
  if (growth > 0) return Math.min(3.0, 1 + Math.log10(growth + 1) / 10);
  return 1.0;
}

export function calculateAirplayScore(
  current: AirplayVolume,
  previous: AirplayVolume | null
): number {
  const volume = airplayVolume(current);
  if (volume <= 0) return 0;

  const logScore = Math.log10(volume + 1) * 100;
  const previousVolume = previous ? airplayVolume(previous) : volume;
  const reachMultiplier =
    1 + Math.min(2.0, Math.log10(Math.max(0, current.totalReach) + 1) / 6);

  return logScore * growthFactor(volume, previousVolume) * reachMultiplier;
}
