import type { SupabaseClient } from '@supabase/supabase-js';
import { BADGE_DEFINITIONS } from '@/backend/services/BadgeDefinitions';
import { evaluateFanBadges } from '@/lib/badges/fan-badge-eval';
import { logger } from '@/lib/logger';

export async function runWeeklyFanBadgeEvaluation(
  supabase: SupabaseClient,
  weekStartIso: string
): Promise<{ fans: number; awarded: number }> {
  const { data: numberOne } = await supabase
    .from('chart_entries')
    .select('releaseId')
    .eq('chartType', 'fan')
    .eq('weekStart', weekStartIso)
    .is('genre', null)
    .eq('placement', 1)
    .maybeSingle();

  const fanChartNumberOneId = numberOne?.releaseId ?? null;

  const { data: weekVotes, error: votesError } = await supabase
    .from('votes')
    .select('fanId, releaseId')
    .eq('weekStart', weekStartIso);

  if (votesError) {
    throw new Error(`Failed to load weekly votes: ${votesError.message}`);
  }

  const votes = weekVotes ?? [];
  const fanIds = [...new Set(votes.map((row) => row.fanId))];
  if (fanIds.length === 0) return { fans: 0, awarded: 0 };

  const { data: fans, error: fansError } = await supabase
    .from('fan_profiles')
    .select('id, userId')
    .in('id', fanIds);

  if (fansError) {
    throw new Error(`Failed to load fan profiles: ${fansError.message}`);
  }

  const releaseIds = [...new Set(votes.map((row) => row.releaseId))];
  const { data: releases } = releaseIds.length
    ? await supabase.from('releases').select('id, genres').in('id', releaseIds)
    : { data: [] };

  const genresByRelease = new Map(
    (releases ?? []).map((row) => [row.id, (row.genres ?? []) as string[]])
  );

  let awarded = 0;

  for (const fan of fans ?? []) {
    const fanVotes = votes.filter((row) => row.fanId === fan.id);
    const votedReleaseIds = fanVotes.map((row) => row.releaseId);
    const genresThisWeek = votedReleaseIds.flatMap(
      (id) => genresByRelease.get(id) ?? []
    );

    const { data: history } = await supabase
      .from('votes')
      .select('weekStart')
      .eq('fanId', fan.id);

    const weekStartsVoted = [
      ...new Set((history ?? []).map((row) => row.weekStart).filter(Boolean)),
    ];

    const slugs = evaluateFanBadges({
      votedReleaseIds,
      fanChartNumberOneId,
      weekStartsVoted,
      currentWeekStart: weekStartIso,
      genresThisWeek,
    });

    for (const slug of slugs) {
      const badgeId = await ensureBadgeRow(supabase, slug);
      if (!badgeId) continue;
      const inserted = await awardIfNew(supabase, fan.userId, badgeId);
      if (inserted) awarded += 1;
    }
  }

  return { fans: (fans ?? []).length, awarded };
}

async function ensureBadgeRow(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const definition = BADGE_DEFINITIONS.find((badge) => badge.id === slug);
  if (!definition) return null;

  const { data: existing } = await supabase
    .from('badges')
    .select('id')
    .eq('name', definition.name)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('badges')
    .insert({ name: definition.name, description: definition.description })
    .select('id')
    .single();

  if (error) {
    logger.warn('Failed to insert badge definition', { slug, error: error.message });
    return null;
  }
  return created?.id ?? null;
}

async function awardIfNew(
  supabase: SupabaseClient,
  userId: string,
  badgeId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('userId', userId)
    .eq('badgeId', badgeId)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase.from('user_badges').insert({ userId, badgeId });
  if (error) {
    logger.warn('Failed to award badge', { userId, badgeId, error: error.message });
    return false;
  }
  return true;
}
