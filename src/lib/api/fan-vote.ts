import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import { calculateVoteCost } from '@/lib/math/quadratic';

interface FanProfileRow {
  id: string;
  remainingCredits: number;
}

interface VoteRowSnapshot {
  id: string;
  wasInsert: boolean;
  previous?: {
    allocatedVotes: number;
    cost: number;
    votes: number;
    credits: number;
    createdAt: string;
  };
}

async function rollbackFanVotes(
  supabase: SupabaseClient,
  snapshots: VoteRowSnapshot[]
): Promise<void> {
  for (const snapshot of snapshots) {
    if (snapshot.wasInsert) {
      await supabase.from('votes').delete().eq('id', snapshot.id);
    } else if (snapshot.previous) {
      await supabase
        .from('votes')
        .update(snapshot.previous)
        .eq('id', snapshot.id);
    }
  }
}

export async function submitFanBulkVotes(params: {
  supabase: SupabaseClient;
  fanProfile: FanProfileRow;
  votes: Record<string, number>;
  creditBudget: number;
  weekStart: Date;
}): Promise<{ votes: unknown[]; remainingCredits: number }> {
  const { supabase, fanProfile, votes, creditBudget, weekStart } = params;
  const entries = Object.entries(votes);
  const weekStartIso = weekStart.toISOString();

  let totalCost = 0;
  for (const [, v] of entries) {
    totalCost += calculateVoteCost(v);
  }

  if (totalCost > creditBudget) {
    throw new ApiError(400, 'Budget exceeded');
  }

  if (fanProfile.remainingCredits < totalCost) {
    throw new ApiError(400, 'Insufficient credits');
  }

  const now = new Date().toISOString();
  const snapshots: VoteRowSnapshot[] = [];
  const createdVotes: unknown[] = [];

  try {
    for (const [releaseId, allocatedVotes] of entries) {
      const cost = calculateVoteCost(allocatedVotes);

      const { data: existingVote, error: existingError } = await supabase
        .from('votes')
        .select('*')
        .eq('fanId', fanProfile.id)
        .eq('releaseId', releaseId)
        .eq('weekStart', weekStartIso)
        .maybeSingle();

      if (existingError) {
        throw new ApiError(500, existingError.message);
      }

      if (existingVote) {
        snapshots.push({
          id: existingVote.id,
          wasInsert: false,
          previous: {
            allocatedVotes: existingVote.allocatedVotes,
            cost: existingVote.cost,
            votes: existingVote.votes,
            credits: existingVote.credits,
            createdAt: existingVote.createdAt,
          },
        });

        const { data: updatedVote, error } = await supabase
          .from('votes')
          .update({
            allocatedVotes,
            cost,
            votes: allocatedVotes,
            credits: cost,
            weekStart: weekStartIso,
            createdAt: now,
          })
          .eq('id', existingVote.id)
          .select()
          .single();

        if (error) {
          throw new ApiError(500, error.message);
        }
        createdVotes.push(updatedVote);
      } else {
        const { data: insertedVote, error } = await supabase
          .from('votes')
          .insert({
            fanId: fanProfile.id,
            releaseId,
            allocatedVotes,
            cost,
            votes: allocatedVotes,
            credits: cost,
            weekStart: weekStartIso,
            createdAt: now,
          })
          .select()
          .single();

        if (error) {
          throw new ApiError(500, error.message);
        }

        snapshots.push({ id: insertedVote.id, wasInsert: true });
        createdVotes.push(insertedVote);
      }
    }

    const remainingCredits = fanProfile.remainingCredits - totalCost;
    const { error: creditError } = await supabase
      .from('fan_profiles')
      .update({
        remainingCredits,
        updatedAt: now,
      })
      .eq('id', fanProfile.id);

    if (creditError) {
      throw new ApiError(500, creditError.message);
    }

    return { votes: createdVotes, remainingCredits };
  } catch (error) {
    await rollbackFanVotes(supabase, snapshots);
    throw error;
  }
}
