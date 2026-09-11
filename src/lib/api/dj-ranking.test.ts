import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicExpert, listPublicExperts, publicDisplayName } from './dj-ranking';

function createClient(
  rows: Array<{
    id: string;
    bio: string | null;
    displayName: string | null;
    soundcloudLink: string | null;
    expertStatus: boolean;
    reputationScore: number;
  }>
): SupabaseClient {
  return {
    from: (table: string) => {
      if (table !== 'dj_profiles') throw new Error(`Unexpected table: ${table}`);
      return {
        select: () => ({
          eq: (col: string, val: string | boolean) => ({
            order: () => ({
              limit: async () => ({
                data: rows.filter((row) => row.expertStatus),
                error: null,
              }),
            }),
            maybeSingle: async () => ({
              data: rows.find((row) => row.id === val) ?? null,
              error: null,
            }),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

describe('publicDisplayName', () => {
  it('prefers displayName over bio', () => {
    expect(publicDisplayName('Hex', 'A long bio', 'abc')).toBe('Hex');
  });
});

describe('listPublicExperts', () => {
  it('returns only verified experts, ordered by reputation, without emails', async () => {
    const supabase = createClient([
      {
        id: 'dj-low',
        bio: 'Low',
        displayName: null,
        soundcloudLink: null,
        expertStatus: true,
        reputationScore: 1.1,
      },
      {
        id: 'dj-high',
        bio: 'ignored',
        displayName: 'High',
        soundcloudLink: 'https://soundcloud.com/high',
        expertStatus: true,
        reputationScore: 2.4,
      },
      {
        id: 'dj-no',
        bio: 'Nope',
        displayName: 'Nope',
        soundcloudLink: null,
        expertStatus: false,
        reputationScore: 3,
      },
    ]);

    const result = await listPublicExperts(supabase);
    expect(result.map((row) => row.id)).toEqual(['dj-high', 'dj-low']);
    expect(result[0]?.displayName).toBe('High');
    expect(result.every((row) => !('email' in row))).toBe(true);
  });
});

describe('getPublicExpert', () => {
  it('hides non-experts', async () => {
    const supabase = createClient([
      {
        id: 'dj-no',
        bio: 'Nope',
        displayName: 'Nope',
        soundcloudLink: null,
        expertStatus: false,
        reputationScore: 1,
      },
    ]);
    await expect(getPublicExpert(supabase, 'dj-no')).resolves.toBeNull();
  });
});
