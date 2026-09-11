import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import { attachArtistToLabel, listLabelRoster } from './label-roster';

interface ArtistRow {
  id: string;
  name: string;
  isVisible: boolean;
  labelId: string | null;
}

function createClient(state: {
  labels: { id: string; userId: string }[];
  artists: ArtistRow[];
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'label_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: state.labels[0] ?? null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'artists') {
        return {
          select: () => {
            const filters: Record<string, unknown> = {};
            const chain = {
              eq: (col: string, val: unknown) => {
                filters[col] = val;
                return chain;
              },
              order: async () => ({
                data: state.artists.filter((a) =>
                  Object.entries(filters).every(([k, v]) => a[k as keyof ArtistRow] === v)
                ),
                error: null,
              }),
              maybeSingle: async () => {
                const found = state.artists.find((a) =>
                  Object.entries(filters).every(([k, v]) => a[k as keyof ArtistRow] === v)
                );
                return { data: found ?? null, error: null };
              },
            };
            return chain;
          },
          update: (payload: { labelId: string }) => ({
            eq: async (col: string, val: string) => {
              const artist = state.artists.find((a) => String(a[col as keyof ArtistRow]) === val);
              if (artist) artist.labelId = payload.labelId;
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe('listLabelRoster', () => {
  it('returns artists linked to the label', async () => {
    const supabase = createClient({
      labels: [{ id: 'lab-1', userId: 'u1' }],
      artists: [
        { id: 'a1', name: 'Ghost', isVisible: true, labelId: 'lab-1' },
        { id: 'a2', name: 'Other', isVisible: true, labelId: 'lab-2' },
      ],
    });
    const roster = await listLabelRoster(supabase, 'u1');
    expect(roster.map((a) => a.id)).toEqual(['a1']);
  });
});

describe('attachArtistToLabel', () => {
  it('links an unclaimed visible artist', async () => {
    const artists: ArtistRow[] = [
      { id: 'a1', name: 'Ghost', isVisible: true, labelId: null },
    ];
    const supabase = createClient({
      labels: [{ id: 'lab-1', userId: 'u1' }],
      artists,
    });
    await attachArtistToLabel(supabase, 'u1', 'a1');
    expect(artists[0].labelId).toBe('lab-1');
  });

  it('rejects an artist already on another roster', async () => {
    const supabase = createClient({
      labels: [{ id: 'lab-1', userId: 'u1' }],
      artists: [{ id: 'a1', name: 'Ghost', isVisible: true, labelId: 'lab-2' }],
    });
    await expect(attachArtistToLabel(supabase, 'u1', 'a1')).rejects.toBeInstanceOf(ApiError);
  });
});
