import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

export interface PublicArtist {
  id: string;
  name: string;
  bio: string | null;
  genres: string[];
  imageUrl: string | null;
  country: string | null;
  foundedYear: number | null;
  verified: boolean;
  profileLink: string | null;
  releases: PublicReleaseSummary[];
}

export interface PublicReleaseSummary {
  id: string;
  title: string;
  releaseDate: string;
  releaseType: string;
  artworkUrl: string | null;
}

export interface PublicRelease {
  id: string;
  title: string;
  releaseDate: string;
  releaseType: string;
  artworkUrl: string | null;
  spotifyId: string | null;
  genres: string[];
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
    verified: boolean;
  } | null;
}

function unwrapArtist(value: unknown): {
  id: string;
  name: string;
  imageUrl: string | null;
  verified: boolean;
  isVisible: boolean;
} | null {
  if (!value || typeof value !== 'object') return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== 'object') return null;
  const artist = row as Record<string, unknown>;
  if (typeof artist.id !== 'string' || typeof artist.name !== 'string') return null;
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: typeof artist.imageUrl === 'string' ? artist.imageUrl : null,
    verified: artist.verified === true,
    isVisible: artist.isVisible === true,
  };
}

function pickArtwork(row: {
  r2ArtworkUrl?: string | null;
  artworkUrl?: string | null;
  itunesArtworkUrl?: string | null;
  vercelBlobUrl?: string | null;
}): string | null {
  return row.r2ArtworkUrl ?? row.artworkUrl ?? row.itunesArtworkUrl ?? row.vercelBlobUrl ?? null;
}

export async function getPublicArtist(
  supabase: SupabaseClient,
  id: string
): Promise<PublicArtist | null> {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('id, name, bio, genres, imageUrl, country, foundedYear, verified, profileLink, isVisible')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!artist || artist.isVisible !== true) return null;

  const { data: releases, error: releaseError } = await supabase
    .from('releases')
    .select('id, title, releaseDate, releaseType, r2ArtworkUrl, artworkUrl, itunesArtworkUrl, vercelBlobUrl, isVisible')
    .eq('artistId', id)
    .eq('isVisible', true)
    .order('releaseDate', { ascending: false });

  if (releaseError) throw new ApiError(500, releaseError.message);

  return {
    id: artist.id,
    name: artist.name,
    bio: artist.bio,
    genres: artist.genres ?? [],
    imageUrl: artist.imageUrl,
    country: artist.country,
    foundedYear: artist.foundedYear,
    verified: artist.verified,
    profileLink: artist.profileLink,
    releases: (releases ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      releaseDate: row.releaseDate,
      releaseType: row.releaseType,
      artworkUrl: pickArtwork(row),
    })),
  };
}

export async function getPublicRelease(
  supabase: SupabaseClient,
  id: string
): Promise<PublicRelease | null> {
  const { data: release, error } = await supabase
    .from('releases')
    .select(
      'id, title, releaseDate, releaseType, r2ArtworkUrl, artworkUrl, itunesArtworkUrl, vercelBlobUrl, spotifyId, genres, isVisible, artist:artists(id, name, imageUrl, verified, isVisible)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!release || release.isVisible !== true) return null;

  const artist = unwrapArtist(release.artist);
  if (artist && artist.isVisible !== true) {
    return null;
  }

  return {
    id: release.id,
    title: release.title,
    releaseDate: release.releaseDate,
    releaseType: release.releaseType,
    artworkUrl: pickArtwork(release),
    spotifyId: release.spotifyId,
    genres: release.genres ?? [],
    artist: artist
      ? { id: artist.id, name: artist.name, imageUrl: artist.imageUrl, verified: artist.verified }
      : null,
  };
}

export async function claimBandArtist(
  supabase: SupabaseClient,
  userId: string,
  artistId: string
): Promise<{ artistId: string }> {
  const { data: band, error: bandError } = await supabase
    .from('band_profiles')
    .select('id, userId, artistId')
    .eq('userId', userId)
    .maybeSingle();

  if (bandError) throw new ApiError(500, bandError.message);
  if (band?.artistId) {
    throw new ApiError(409, 'This band account already claimed an artist', 'ALREADY_CLAIMED');
  }

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, isVisible')
    .eq('id', artistId)
    .maybeSingle();

  if (artistError) throw new ApiError(500, artistError.message);
  if (!artist || artist.isVisible !== true) {
    throw new ApiError(404, 'Artist not found', 'ARTIST_NOT_FOUND');
  }

  const { data: taken, error: takenError } = await supabase
    .from('band_profiles')
    .select('id')
    .eq('artistId', artistId)
    .maybeSingle();

  if (takenError) throw new ApiError(500, takenError.message);
  if (taken) {
    throw new ApiError(409, 'This artist is already claimed', 'ARTIST_CLAIMED');
  }

  const now = new Date().toISOString();
  if (band) {
    const { error } = await supabase
      .from('band_profiles')
      .update({ artistId, updatedAt: now })
      .eq('id', band.id);
    if (error) throw new ApiError(500, error.message);
  } else {
    const { error } = await supabase.from('band_profiles').insert({
      userId,
      artistId,
      members: [],
    });
    if (error) throw new ApiError(500, error.message);
  }

  const { error: verifyError } = await supabase
    .from('artists')
    .update({ verified: true, updatedAt: now })
    .eq('id', artistId);

  if (verifyError) throw new ApiError(500, verifyError.message);

  return { artistId };
}
