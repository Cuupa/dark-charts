import type { SupabaseClient } from '@supabase/supabase-js';

export interface PublicExpert {
  id: string;
  displayName: string;
  reputationScore: number;
  soundcloudLink: string | null;
  bio: string | null;
}

export function publicDisplayName(
  displayName: string | null | undefined,
  bio: string | null | undefined,
  id: string
): string {
  const named = displayName?.trim();
  if (named) return named.slice(0, 80);
  const line = bio?.split('\n')[0]?.trim();
  if (line) return line.slice(0, 80);
  return `Club DJ ${id.slice(0, 8)}`;
}

export async function listPublicExperts(
  supabase: SupabaseClient,
  limit = 50
): Promise<PublicExpert[]> {
  const { data, error } = await supabase
    .from('dj_profiles')
    .select('id, bio, displayName, soundcloudLink, expertStatus, reputationScore')
    .eq('expertStatus', true)
    .order('reputationScore', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load club ranking: ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => row.expertStatus)
    .sort((a, b) => Number(b.reputationScore ?? 0) - Number(a.reputationScore ?? 0))
    .map((row) => ({
      id: row.id,
      displayName: publicDisplayName(row.displayName, row.bio, row.id),
      reputationScore: Number(row.reputationScore ?? 1),
      soundcloudLink: row.soundcloudLink,
      bio: row.bio,
    }));
}

export async function getPublicExpert(
  supabase: SupabaseClient,
  id: string
): Promise<PublicExpert | null> {
  const { data, error } = await supabase
    .from('dj_profiles')
    .select('id, bio, displayName, soundcloudLink, expertStatus, reputationScore')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load DJ: ${error.message}`);
  if (!data?.expertStatus) return null;

  return {
    id: data.id,
    displayName: publicDisplayName(data.displayName, data.bio, data.id),
    reputationScore: Number(data.reputationScore ?? 1),
    soundcloudLink: data.soundcloudLink,
    bio: data.bio,
  };
}
