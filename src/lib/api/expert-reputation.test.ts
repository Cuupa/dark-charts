import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateDjReputationsFromLaterCharts } from './expert-reputation';

function createClient(state: {
  votes: { djId: string; releaseId: string }[];
  profiles: { id: string; reputationScore: number }[];
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'expert_votes') {
        return {
          select: () => ({
            eq: async () => ({ data: state.votes, error: null }),
          }),
        };
      }
      if (table === 'dj_profiles') {
        return {
          select: () => ({
            in: async () => ({ data: state.profiles, error: null }),
          }),
          update: (payload: { reputationScore: number }) => ({
            eq: async (col: string, val: string) => {
              const profile = state.profiles.find((row) => row.id === val);
              if (profile) profile.reputationScore = payload.reputationScore;
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe('updateDjReputationsFromLaterCharts', () => {
  it('raises reputation when last week’s ballot later appears in the fan top', async () => {
    const state = {
      votes: [
        { djId: 'dj-1', releaseId: 'hit' },
        { djId: 'dj-1', releaseId: 'hit-2' },
      ],
      profiles: [{ id: 'dj-1', reputationScore: 1 }],
    };
    const supabase = createClient(state);
    const updated = await updateDjReputationsFromLaterCharts(supabase, 'week', ['hit', 'hit-2']);
    expect(updated).toBe(1);
    expect(state.profiles[0].reputationScore).toBeGreaterThan(1);
  });

  it('does nothing when there are no previous expert votes', async () => {
    const supabase = createClient({ votes: [], profiles: [] });
    await expect(
      updateDjReputationsFromLaterCharts(supabase, 'week', ['a'])
    ).resolves.toBe(0);
  });
});
