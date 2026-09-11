import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import { claimBandArtist, getPublicArtist, getPublicRelease } from './public-catalog';

interface ArtistRow {
  id: string;
  name: string;
  bio: string | null;
  genres: string[];
  imageUrl: string | null;
  country: string | null;
  foundedYear: number | null;
  verified: boolean;
  profileLink: string | null;
  isVisible: boolean;
}

interface ReleaseRow {
  id: string;
  title: string;
  releaseDate: string;
  releaseType: string;
  artistId: string;
  isVisible: boolean;
  r2ArtworkUrl: string | null;
  artworkUrl: string | null;
  itunesArtworkUrl: string | null;
  vercelBlobUrl: string | null;
  spotifyId: string | null;
  genres: string[];
}

interface BandRow {
  id: string;
  userId: string;
  artistId: string | null;
}

function createClient(state: {
  artists: ArtistRow[];
  releases: ReleaseRow[];
  bands: BandRow[];
}): SupabaseClient {
  const eqChain = (table: string, rows: Record<string, unknown>[]) => {
    const filters: Record<string, unknown> = {};
    const apply = () =>
      rows.filter((row) =>
        Object.entries(filters).every(([key, value]) => row[key] === value)
      );

    const chain = {
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return chain;
      },
      order: async () => ({ data: apply(), error: null }),
      maybeSingle: async () => {
        const found = apply()[0] ?? null;
        return { data: found, error: null };
      },
    };
    return chain;
  };

  return {
    from: (table: string) => {
      if (table === 'artists') {
        return {
          select: () => eqChain('artists', state.artists as unknown as Record<string, unknown>[]),
          update: (payload: Partial<ArtistRow>) => ({
            eq: async (col: string, val: string) => {
              const artist = state.artists.find((a) => String(a[col as keyof ArtistRow]) === val);
              if (artist) Object.assign(artist, payload);
              return { error: null };
            },
          }),
        };
      }
      if (table === 'releases') {
        return {
          select: () => {
            const chain = eqChain('releases', state.releases as unknown as Record<string, unknown>[]);
            const originalMaybe = chain.maybeSingle;
            chain.maybeSingle = async () => {
              const result = await originalMaybe();
              if (!result.data) return result;
              const row = result.data as unknown as ReleaseRow;
              const artist = state.artists.find((a) => a.id === row.artistId) ?? null;
              return { data: { ...row, artist }, error: null };
            };
            return chain;
          },
        };
      }
      if (table === 'band_profiles') {
        return {
          select: () => eqChain('bands', state.bands as unknown as Record<string, unknown>[]),
          update: (payload: Partial<BandRow>) => ({
            eq: async (col: string, val: string) => {
              const band = state.bands.find((b) => String(b[col as keyof BandRow]) === val);
              if (band) Object.assign(band, payload);
              return { error: null };
            },
          }),
          insert: async (row: BandRow) => {
            state.bands.push({
              id: row.id ?? 'b-new',
              userId: row.userId,
              artistId: row.artistId ?? null,
            });
            return { error: null };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

const artist: ArtistRow = {
  id: 'a1',
  name: 'Ghost',
  bio: 'Occult metal',
  genres: ['Gothic Metal'],
  imageUrl: null,
  country: 'SE',
  foundedYear: 2006,
  verified: false,
  profileLink: null,
  isVisible: true,
};

const release: ReleaseRow = {
  id: 'r1',
  title: 'Square Hammer',
  releaseDate: '2016-09-16',
  releaseType: 'single',
  artistId: 'a1',
  isVisible: true,
  r2ArtworkUrl: null,
  artworkUrl: null,
  itunesArtworkUrl: null,
  vercelBlobUrl: null,
  spotifyId: null,
  genres: ['Gothic Metal'],
};

describe('getPublicArtist', () => {
  it('returns a visible artist and their visible releases', async () => {
    const supabase = createClient({
      artists: [artist],
      releases: [release],
      bands: [],
    });
    const result = await getPublicArtist(supabase, 'a1');
    expect(result?.name).toBe('Ghost');
    expect(result?.releases).toHaveLength(1);
    expect(result?.releases[0].title).toBe('Square Hammer');
  });

  it('returns null for a hidden artist', async () => {
    const supabase = createClient({
      artists: [{ ...artist, isVisible: false }],
      releases: [release],
      bands: [],
    });
    await expect(getPublicArtist(supabase, 'a1')).resolves.toBeNull();
  });
});

describe('getPublicRelease', () => {
  it('returns a visible release with artist', async () => {
    const supabase = createClient({
      artists: [artist],
      releases: [release],
      bands: [],
    });
    const result = await getPublicRelease(supabase, 'r1');
    expect(result?.title).toBe('Square Hammer');
    expect(result?.artist?.name).toBe('Ghost');
  });

  it('returns null for a hidden release', async () => {
    const supabase = createClient({
      artists: [artist],
      releases: [{ ...release, isVisible: false }],
      bands: [],
    });
    await expect(getPublicRelease(supabase, 'r1')).resolves.toBeNull();
  });
});

describe('claimBandArtist', () => {
  it('links an unclaimed visible artist to the band profile', async () => {
    const bands: BandRow[] = [{ id: 'b1', userId: 'u1', artistId: null }];
    const artists = [{ ...artist }];
    const supabase = createClient({ artists, releases: [], bands });

    const result = await claimBandArtist(supabase, 'u1', 'a1');
    expect(result.artistId).toBe('a1');
    expect(bands[0].artistId).toBe('a1');
    expect(artists[0].verified).toBe(true);
  });

  it('rejects a second claim by the same band', async () => {
    const supabase = createClient({
      artists: [artist],
      releases: [],
      bands: [{ id: 'b1', userId: 'u1', artistId: 'already' }],
    });
    await expect(claimBandArtist(supabase, 'u1', 'a1')).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a hidden artist', async () => {
    const supabase = createClient({
      artists: [{ ...artist, isVisible: false }],
      releases: [],
      bands: [{ id: 'b1', userId: 'u1', artistId: null }],
    });
    await expect(claimBandArtist(supabase, 'u1', 'a1')).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects an artist already claimed by another band', async () => {
    const supabase = createClient({
      artists: [artist],
      releases: [],
      bands: [
        { id: 'b1', userId: 'u1', artistId: null },
        { id: 'b2', userId: 'u2', artistId: 'a1' },
      ],
    });
    await expect(claimBandArtist(supabase, 'u1', 'a1')).rejects.toMatchObject({
      code: 'ARTIST_CLAIMED',
    });
  });
});
