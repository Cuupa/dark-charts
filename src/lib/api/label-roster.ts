import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

export interface LabelRosterArtist {
  id: string;
  name: string;
  verified: boolean;
}

export async function listLabelRoster(
  supabase: SupabaseClient,
  userId: string
): Promise<LabelRosterArtist[]> {
  const label = await requireLabelProfile(supabase, userId);

  const { data, error } = await supabase
    .from('artists')
    .select('id, name, verified, isVisible, labelId')
    .eq('labelId', label.id)
    .eq('isVisible', true)
    .order('name', { ascending: true });

  if (error) throw new ApiError(500, error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    verified: row.verified,
  }));
}

export async function attachArtistToLabel(
  supabase: SupabaseClient,
  userId: string,
  artistId: string
): Promise<{ artistId: string }> {
  const label = await requireLabelProfile(supabase, userId);

  const { data: artist, error } = await supabase
    .from('artists')
    .select('id, isVisible, labelId')
    .eq('id', artistId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!artist || artist.isVisible !== true) {
    throw new ApiError(404, 'Artist not found', 'ARTIST_NOT_FOUND');
  }
  if (artist.labelId && artist.labelId !== label.id) {
    throw new ApiError(409, 'Artist already on another label roster', 'ARTIST_CLAIMED');
  }

  const { error: updateError } = await supabase
    .from('artists')
    .update({ labelId: label.id, updatedAt: new Date().toISOString() })
    .eq('id', artistId);

  if (updateError) throw new ApiError(500, updateError.message);
  return { artistId };
}

async function requireLabelProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('label_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Label profile not found');
  return data;
}
