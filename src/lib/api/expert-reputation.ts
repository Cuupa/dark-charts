import type { SupabaseClient } from '@supabase/supabase-js';
import { nextReputationScore } from '@/lib/math/expert-reputation';

interface ExpertVoteRow {
  djId: string;
  releaseId: string;
}

export async function updateDjReputationsFromLaterCharts(
  supabase: SupabaseClient,
  previousWeekStartIso: string,
  fanTopReleaseIds: string[]
): Promise<number> {
  if (fanTopReleaseIds.length === 0) return 0;

  const { data: previousVotes, error: votesError } = await supabase
    .from('expert_votes')
    .select('djId, releaseId')
    .eq('weekStart', previousWeekStartIso);

  if (votesError) {
    throw new Error(`Failed to fetch previous expert votes: ${votesError.message}`);
  }

  const votes = (previousVotes ?? []) as ExpertVoteRow[];
  if (votes.length === 0) return 0;

  const fanTop = new Set(fanTopReleaseIds);
  const byDj = new Map<string, { hits: number; ballotSize: number }>();
  for (const vote of votes) {
    const entry = byDj.get(vote.djId) ?? { hits: 0, ballotSize: 0 };
    entry.ballotSize += 1;
    if (fanTop.has(vote.releaseId)) entry.hits += 1;
    byDj.set(vote.djId, entry);
  }

  const djIds = [...byDj.keys()];
  const { data: profiles, error: profileError } = await supabase
    .from('dj_profiles')
    .select('id, reputationScore')
    .in('id', djIds);

  if (profileError) {
    throw new Error(`Failed to fetch DJ profiles: ${profileError.message}`);
  }

  const now = new Date().toISOString();
  let updated = 0;
  for (const profile of profiles ?? []) {
    const ballot = byDj.get(profile.id);
    if (!ballot) continue;
    const next = nextReputationScore(
      Number(profile.reputationScore ?? 1),
      ballot.hits,
      ballot.ballotSize
    );
    const { error } = await supabase
      .from('dj_profiles')
      .update({ reputationScore: next, updatedAt: now })
      .eq('id', profile.id);
    if (error) {
      throw new Error(`Failed to update DJ reputation: ${error.message}`);
    }
    updated += 1;
  }

  return updated;
}
