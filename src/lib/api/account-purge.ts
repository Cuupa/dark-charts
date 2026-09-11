import type { SupabaseClient } from '@supabase/supabase-js';

export const INACTIVE_RETENTION_MONTHS = 24;
export const INACTIVE_PURGE_BATCH = 25;

export function isAccountInactive(lastActivityIso: string, now = new Date()): boolean {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - INACTIVE_RETENTION_MONTHS, now.getUTCDate())
  );
  cutoff.setUTCHours(0, 0, 0, 0);
  return lastActivityIso.slice(0, 10) < cutoff.toISOString().slice(0, 10);
}

export async function purgeUserAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: fanProfile } = await supabase
    .from('fan_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (fanProfile?.id) {
    await supabase.from('votes').delete().eq('fanId', fanProfile.id);
    await supabase.from('fan_profiles').delete().eq('id', fanProfile.id);
  }

  const { data: djProfile } = await supabase
    .from('dj_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (djProfile?.id) {
    await supabase.from('expert_votes').delete().eq('djId', djProfile.id);
    await supabase.from('dj_profiles').delete().eq('id', djProfile.id);
  }

  await supabase.from('band_profiles').delete().eq('userId', userId);
  await supabase.from('label_profiles').delete().eq('userId', userId);
  await supabase.from('user_badges').delete().eq('userId', userId);
  await supabase.from('bookings').delete().eq('userId', userId);

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}

export async function deleteInactiveAccounts(
  supabase: SupabaseClient,
  now = new Date()
): Promise<{ scanned: number; deleted: number }> {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - INACTIVE_RETENTION_MONTHS, now.getUTCDate())
  );
  cutoff.setUTCHours(0, 0, 0, 0);
  const cutoffIso = cutoff.toISOString();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, role, updatedAt')
    .neq('role', 'ADMIN')
    .lt('updatedAt', cutoffIso)
    .limit(INACTIVE_PURGE_BATCH);

  if (error) {
    throw new Error(`Failed to list inactive users: ${error.message}`);
  }

  const candidates = users ?? [];
  let deleted = 0;

  for (const user of candidates) {
    const lastVote = await latestRelatedActivity(supabase, user.id);
    const lastActivity = [user.updatedAt, lastVote].filter(Boolean).sort().at(-1) ?? user.updatedAt;
    if (!isAccountInactive(lastActivity, now)) continue;
    await purgeUserAccount(supabase, user.id);
    deleted += 1;
  }

  return { scanned: candidates.length, deleted };
}

async function latestRelatedActivity(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: fan } = await supabase
    .from('fan_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  let latest: string | null = null;

  if (fan?.id) {
    const { data: vote } = await supabase
      .from('votes')
      .select('createdAt')
      .eq('fanId', fan.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (vote?.createdAt) latest = vote.createdAt;
  }

  const { data: dj } = await supabase
    .from('dj_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (dj?.id) {
    const { data: expertVote } = await supabase
      .from('expert_votes')
      .select('createdAt')
      .eq('djId', dj.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (expertVote?.createdAt && (!latest || expertVote.createdAt > latest)) {
      latest = expertVote.createdAt;
    }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('createdAt')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (booking?.createdAt && (!latest || booking.createdAt > latest)) {
    latest = booking.createdAt;
  }

  return latest;
}
