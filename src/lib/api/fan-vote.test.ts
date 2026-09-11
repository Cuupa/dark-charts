import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import { submitFanBulkVotes } from './fan-vote';

interface StoredVote {
  id: string;
  fanId: string;
  releaseId: string;
  weekStart: string;
  allocatedVotes: number;
  cost: number;
  votes: number;
  credits: number;
  createdAt: string;
}

function createVoteClient(state: {
  votes: StoredVote[];
  remainingCredits: number;
  failCreditUpdate?: boolean;
}): SupabaseClient {
  let nextId = state.votes.length + 1;

  return {
    from: (table: string) => {
      if (table === 'votes') {
        return {
          select: () => {
            const filters: Record<string, string> = {};
            const chain = {
              eq: (col: string, val: string) => {
                filters[col] = val;
                return chain;
              },
              maybeSingle: async () => {
                const found =
                  state.votes.find(
                    (v) =>
                      v.fanId === filters.fanId &&
                      v.releaseId === filters.releaseId &&
                      v.weekStart === filters.weekStart
                  ) ?? null;
                return { data: found, error: null };
              },
            };
            return chain;
          },
          insert: (row: Omit<StoredVote, 'id'>) => ({
            select: () => ({
              single: async () => {
                const inserted: StoredVote = { ...row, id: `vote-${nextId++}` };
                state.votes.push(inserted);
                return { data: inserted, error: null };
              },
            }),
          }),
          update: (patch: Partial<StoredVote>) => {
            const apply = (id: string) => {
              const idx = state.votes.findIndex((v) => v.id === id);
              if (idx < 0) {
                return { data: null, error: { message: 'not found' } };
              }
              state.votes[idx] = { ...state.votes[idx], ...patch };
              return { data: state.votes[idx], error: null };
            };
            return {
              eq: (col: string, val: string) => {
                if (col !== 'id') {
                  throw new Error(`Unexpected update filter ${col}`);
                }
                const thenable = {
                  then: (
                    resolve: (value: { data: StoredVote | null; error: unknown }) => void,
                    reject?: (reason: unknown) => void
                  ) => Promise.resolve(apply(val)).then(resolve, reject),
                  select: () => ({
                    single: async () => apply(val),
                  }),
                };
                return thenable;
              },
            };
          },
          delete: () => ({
            eq: async (_col: string, val: string) => {
              state.votes = state.votes.filter((v) => v.id !== val);
              return { error: null };
            },
          }),
        };
      }

      if (table === 'fan_profiles') {
        return {
          update: (payload: { remainingCredits: number }) => ({
            eq: async () => {
              if (state.failCreditUpdate) {
                return { error: { message: 'credit update failed' } };
              }
              state.remainingCredits = payload.remainingCredits;
              return { error: null };
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

const WEEK_A = '2026-09-07T00:00:00.000Z';
const WEEK_B = '2026-09-14T00:00:00.000Z';

describe('submitFanBulkVotes', () => {
  it('inserts votes tagged with weekStart and decrements credits', async () => {
    const state = { votes: [] as StoredVote[], remainingCredits: 150 };
    const supabase = createVoteClient(state);

    const result = await submitFanBulkVotes({
      supabase,
      fanProfile: { id: 'fan-1', remainingCredits: 150 },
      votes: { 'rel-1': 2, 'rel-2': 1 },
      creditBudget: 150,
      weekStart: new Date(WEEK_A),
    });

    expect(result.remainingCredits).toBe(145);
    expect(state.votes).toHaveLength(2);
    expect(state.votes.every((v) => v.weekStart === WEEK_A)).toBe(true);
    expect(state.votes.find((v) => v.releaseId === 'rel-1')?.cost).toBe(4);
  });

  it('keeps a previous week ballot when voting the same release again', async () => {
    const prior: StoredVote = {
      id: 'vote-old',
      fanId: 'fan-1',
      releaseId: 'rel-1',
      weekStart: WEEK_A,
      allocatedVotes: 3,
      cost: 9,
      votes: 3,
      credits: 9,
      createdAt: WEEK_A,
    };
    const state = { votes: [prior], remainingCredits: 150 };
    const supabase = createVoteClient(state);

    await submitFanBulkVotes({
      supabase,
      fanProfile: { id: 'fan-1', remainingCredits: 150 },
        votes: { 'rel-1': 1 },
      creditBudget: 150,
      weekStart: new Date(WEEK_B),
    });

    expect(state.votes).toHaveLength(2);
    expect(state.votes.find((v) => v.id === 'vote-old')?.allocatedVotes).toBe(3);
    expect(state.votes.find((v) => v.weekStart === WEEK_B)?.allocatedVotes).toBe(1);
  });

  it('updates the current-week row instead of inserting a duplicate', async () => {
    const current: StoredVote = {
      id: 'vote-now',
      fanId: 'fan-1',
      releaseId: 'rel-1',
      weekStart: WEEK_A,
      allocatedVotes: 1,
      cost: 1,
      votes: 1,
      credits: 1,
      createdAt: WEEK_A,
    };
    const state = { votes: [current], remainingCredits: 149 };
    const supabase = createVoteClient(state);

    await submitFanBulkVotes({
      supabase,
      fanProfile: { id: 'fan-1', remainingCredits: 149 },
      votes: { 'rel-1': 2 },
      creditBudget: 150,
      weekStart: new Date(WEEK_A),
    });

    expect(state.votes).toHaveLength(1);
    expect(state.votes[0].allocatedVotes).toBe(2);
    expect(state.votes[0].cost).toBe(4);
    expect(state.votes[0].weekStart).toBe(WEEK_A);
  });

  it('rejects a ballot over the credit budget', async () => {
    const supabase = createVoteClient({ votes: [], remainingCredits: 150 });
    await expect(
      submitFanBulkVotes({
        supabase,
        fanProfile: { id: 'fan-1', remainingCredits: 150 },
        votes: { 'rel-1': 13 },
        creditBudget: 150,
        weekStart: new Date(WEEK_A),
      })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rolls back inserts when credit update fails', async () => {
    const state = { votes: [] as StoredVote[], remainingCredits: 150, failCreditUpdate: true };
    const supabase = createVoteClient(state);

    await expect(
      submitFanBulkVotes({
        supabase,
        fanProfile: { id: 'fan-1', remainingCredits: 150 },
      votes: { 'rel-1': 1 },
        creditBudget: 150,
        weekStart: new Date(WEEK_A),
      })
    ).rejects.toBeInstanceOf(ApiError);

    expect(state.votes).toHaveLength(0);
  });
});
