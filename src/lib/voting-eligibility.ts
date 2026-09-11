export const VOTING_ELIGIBILITY_MONTHS = 12;

export function getVotingEligibilityCutoff(now = new Date()): Date {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - VOTING_ELIGIBILITY_MONTHS, now.getUTCDate())
  );
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff;
}

export function isReleaseEligibleForVoting(
  releaseDate: string | null | undefined,
  now = new Date()
): boolean {
  if (!releaseDate) return false;
  const cutoff = getVotingEligibilityCutoff(now).toISOString().slice(0, 10);
  return releaseDate.slice(0, 10) >= cutoff;
}
