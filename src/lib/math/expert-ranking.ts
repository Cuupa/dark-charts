export const EXPERT_PRIOR_STRENGTH = 5;

export function calculateExpertPoints(rank: number, reputationScore: number): number {
  let basePoints = 0;
  if (rank === 1) basePoints = 10;
  else if (rank === 2) basePoints = 8;
  else if (rank === 3) basePoints = 6;
  else if (rank === 4) basePoints = 4;
  else if (rank === 5) basePoints = 2;
  else if (rank >= 6 && rank <= 10) basePoints = 1;

  return basePoints * Math.max(1, reputationScore);
}

export function shrinkExpertScore(
  rawScore: number,
  voteCount: number,
  prior: number,
  strength = EXPERT_PRIOR_STRENGTH
): number {
  const n = Math.max(0, voteCount);
  const m = Math.max(0, strength);
  if (n + m <= 0) return prior;
  return (n / (n + m)) * rawScore + (m / (n + m)) * prior;
}

export function shrinkExpertScores(
  entries: { releaseId: string; rawScore: number; voteCount: number }[]
): { releaseId: string; score: number }[] {
  if (entries.length === 0) return [];
  const prior = entries.reduce((sum, entry) => sum + entry.rawScore, 0) / entries.length;
  return entries.map((entry) => ({
    releaseId: entry.releaseId,
    score: shrinkExpertScore(entry.rawScore, entry.voteCount, prior),
  }));
}
