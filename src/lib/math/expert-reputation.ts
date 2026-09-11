export const REPUTATION_MIN = 1;
export const REPUTATION_MAX = 3;
export const REPUTATION_BLEND = 0.3;

export function nextReputationScore(
  current: number,
  hits: number,
  ballotSize: number
): number {
  const size = Math.max(1, ballotSize);
  const accuracy = Math.min(1, Math.max(0, hits / size));
  const observed = REPUTATION_MIN + (REPUTATION_MAX - REPUTATION_MIN) * accuracy;
  const blended = current * (1 - REPUTATION_BLEND) + observed * REPUTATION_BLEND;
  return Math.min(REPUTATION_MAX, Math.max(REPUTATION_MIN, blended));
}
