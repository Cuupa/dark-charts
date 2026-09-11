import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ingestStreamingSnapshots } from './streaming-snapshots';

interface ArtistRow {
  id: string;
  spotifyId: string | null;
  socialLinks: { youtube?: string } | null;
}

interface SnapshotRow {
  id: string;
  artistId: string;
  weekStart: string;
  spotifyPopularity: number;
  followerCount: number;
  topTrackPopularity: number;
  youtubePopularity: number;
}

function createClient(state: { artists: ArtistRow[]; snapshots: SnapshotRow[] }): SupabaseClient {
  let nextId = 1;
  return {
    from: (table: string) => {
      if (table === 'artists') {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                limit: async () => ({
                  data: state.artists.filter((artist) => artist.spotifyId),
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'streaming_snapshots') {
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
                  state.snapshots.find(
                    (row) =>
                      row.artistId === filters.artistId && row.weekStart === filters.weekStart
                  ) ?? null;
                return { data: found, error: null };
              },
            };
            return chain;
          },
          insert: async (row: Omit<SnapshotRow, 'id'>) => {
            state.snapshots.push({ ...row, id: `snap-${nextId++}` });
            return { error: null };
          },
          update: (payload: Partial<SnapshotRow>) => ({
            eq: async (_col: string, val: string) => {
              const snap = state.snapshots.find((row) => row.id === val);
              if (snap) Object.assign(snap, payload);
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe('ingestStreamingSnapshots', () => {
  it('writes a snapshot for each visible artist with a Spotify id', async () => {
    const state = {
      artists: [
        { id: 'a1', spotifyId: 'sp1', socialLinks: null },
        { id: 'a2', spotifyId: null, socialLinks: null },
      ],
      snapshots: [] as SnapshotRow[],
    };

    const result = await ingestStreamingSnapshots({
      supabase: createClient(state),
      weekStart: new Date('2026-09-07T00:00:00.000Z'),
      fetchSpotify: async () => ({
        popularity: 70,
        followerCount: 1000,
        topTrackAvgPopularity: 65,
      }),
    });

    expect(result.written).toBe(1);
    expect(state.snapshots[0]?.spotifyPopularity).toBe(70);
    expect(state.snapshots[0]?.artistId).toBe('a1');
  });

  it('skips artists when Spotify returns nothing', async () => {
    const state = {
      artists: [{ id: 'a1', spotifyId: 'sp1', socialLinks: null }],
      snapshots: [] as SnapshotRow[],
    };

    const result = await ingestStreamingSnapshots({
      supabase: createClient(state),
      weekStart: new Date('2026-09-07T00:00:00.000Z'),
      fetchSpotify: async () => null,
    });

    expect(result.written).toBe(0);
    expect(result.skipped).toBe(1);
  });
});
