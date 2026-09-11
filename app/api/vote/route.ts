import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireAuth, requireVerifiedVoter, getStartOfWeek } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getIsVotingPaused, getVoiceCreditsBudget } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { assertNoVoteConflicts } from '@/lib/vote-conflicts';
import { assertReleasesNotVoteBlocked } from '@/lib/vote-anomaly-guard';
import { submitFanBulkVotes } from '@/lib/api/fan-vote';
import { isReleaseEligibleForVoting } from '@/lib/voting-eligibility';

const bodySchema = z.object({
  type: z.literal('bulk').optional(),
  votes: z.record(z.string(), z.number().int().min(1)).optional(),
  releaseId: z.string().optional(),
  rank: z.number().int().min(1).max(10).optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const decoded = await requireAuth(req);
  const { userId, role, isDemo } = decoded;

  await requireVerifiedVoter(decoded);

  if (role !== 'FAN' && role !== 'DJ') {
    throw new ApiError(403, 'Forbidden: Role not authorized to vote');
  }

  const supabase = createServiceRoleSupabaseClient();
  const votingPaused = await getIsVotingPaused(supabase);
  if (votingPaused) {
    throw new ApiError(403, 'Voting is currently paused', 'VOTING_PAUSED');
  }

  const body = await req.json();
  const parseResult = bodySchema.safeParse(body);
  if (!parseResult.success) {
    throw new ApiError(400, 'Invalid body parameters', 'VALIDATION_ERROR');
  }

  const { type, votes, releaseId, rank } = parseResult.data;
  const creditBudget = await getVoiceCreditsBudget(supabase);

  if (isDemo) {
    logger.info('Demo vote received – skipping persistence', { userId, role });
    const response = NextResponse.json({
      success: true,
      votes: [],
      remainingCredits: creditBudget,
      creditBudget,
      isDemo: true,
    });
    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 20,
    });
  }

  if (role === 'FAN') {
    if (type !== 'bulk' || !votes) {
      throw new ApiError(400, 'Single FAN vote is deprecated. Use bulk type.');
    }

    const entries = Object.entries(votes);
    if (entries.length === 0) {
      throw new ApiError(400, 'No votes provided');
    }

    const { data: fanProfile, error: fanError } = await supabase
      .from('fan_profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (fanError) throw new ApiError(500, fanError.message);
    if (!fanProfile) throw new ApiError(404, 'Fan profile not found');

    const startOfWeek = getStartOfWeek();
    const weekStartIso = startOfWeek.toISOString();

    const { count: weeklyVoteCount, error: weeklyCountError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('fanId', fanProfile.id)
      .eq('weekStart', weekStartIso);

    if (weeklyCountError) throw new ApiError(500, weeklyCountError.message);
    if ((weeklyVoteCount ?? 0) > 0) {
      throw new ApiError(409, 'You have already submitted your vote this week', 'ALREADY_VOTED');
    }

    const releaseIds = entries.map(([rId]) => rId);
    const { data: visibleReleases, error: releaseError } = await supabase
      .from('releases')
      .select('id, releaseDate')
      .in('id', releaseIds)
      .eq('isVisible', true);

    if (releaseError) throw new ApiError(500, releaseError.message);
    if ((visibleReleases ?? []).length !== releaseIds.length) {
      throw new ApiError(400, 'One or more releases are not available for voting');
    }
    if (!(visibleReleases ?? []).every((release) => isReleaseEligibleForVoting(release.releaseDate))) {
      throw new ApiError(400, 'One or more releases are outside the voting window', 'RELEASE_NOT_ELIGIBLE');
    }

    await assertNoVoteConflicts(supabase, userId, releaseIds);
    await assertReleasesNotVoteBlocked(supabase, releaseIds, startOfWeek.toISOString());

    const { votes: createdVotes, remainingCredits } = await submitFanBulkVotes({
      supabase,
      fanProfile,
      votes,
      creditBudget,
      weekStart: startOfWeek,
    });

    const response = NextResponse.json({
      success: true,
      votes: createdVotes,
      remainingCredits,
      creditBudget,
    });
    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 20,
    });
  }

  const { data: djProfile, error: djError } = await supabase
    .from('dj_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (djError) throw new ApiError(500, djError.message);
  if (!djProfile) throw new ApiError(404, 'DJ profile not found');
  if (!djProfile.expertStatus) {
    throw new ApiError(403, 'Expert status required to submit expert votes');
  }

  const startOfWeek = getStartOfWeek();

  if (type === 'bulk' && votes) {
    const entries = Object.entries(votes);
    if (entries.length !== 10) {
      throw new ApiError(400, 'DJs must submit exactly 10 votes');
    }

    const releaseIds = entries.map(([rId]) => rId);
    const { data: visibleReleases, error: releaseError } = await supabase
      .from('releases')
      .select('id, releaseDate')
      .in('id', releaseIds)
      .eq('isVisible', true);

    if (releaseError) throw new ApiError(500, releaseError.message);
    if ((visibleReleases ?? []).length !== releaseIds.length) {
      throw new ApiError(400, 'One or more releases are not available for voting');
    }
    if (!(visibleReleases ?? []).every((release) => isReleaseEligibleForVoting(release.releaseDate))) {
      throw new ApiError(400, 'One or more releases are outside the voting window', 'RELEASE_NOT_ELIGIBLE');
    }

    await assertNoVoteConflicts(supabase, userId, releaseIds);
    await assertReleasesNotVoteBlocked(supabase, releaseIds, startOfWeek.toISOString());

    const weekStartIso = startOfWeek.toISOString();

    await supabase
      .from('expert_votes')
      .delete()
      .eq('djId', djProfile.id)
      .eq('weekStart', weekStartIso);

    const createdVotes = [];
    for (const [rId, voteRank] of entries) {
      const { data: createdVote, error } = await supabase
        .from('expert_votes')
        .insert({
          djId: djProfile.id,
          releaseId: rId,
          rank: voteRank,
          rating: voteRank,
          weekStart: weekStartIso,
        })
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      createdVotes.push(createdVote);
    }

    const response = NextResponse.json({ success: true, votes: createdVotes });
    return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
      windowMs: 60_000,
      maxRequests: 20,
    });
  }

  if (!releaseId) {
    throw new ApiError(400, 'releaseId is required for DJ role');
  }

  const { data: release } = await supabase
    .from('releases')
    .select('id, releaseDate')
    .eq('id', releaseId)
    .eq('isVisible', true)
    .maybeSingle();

  if (!release) throw new ApiError(404, 'Release not found');
  if (!isReleaseEligibleForVoting(release.releaseDate)) {
    throw new ApiError(400, 'Release is outside the voting window', 'RELEASE_NOT_ELIGIBLE');
  }
  if (rank === undefined) throw new ApiError(400, 'rank is required for DJ role');

  await assertNoVoteConflicts(supabase, userId, [releaseId]);
  await assertReleasesNotVoteBlocked(supabase, [releaseId], startOfWeek.toISOString());

  const weekStartIso = startOfWeek.toISOString();

  const { data: existingExpertVoteWithRank } = await supabase
    .from('expert_votes')
    .select('*')
    .eq('djId', djProfile.id)
    .eq('rank', rank)
    .eq('weekStart', weekStartIso)
    .maybeSingle();

  if (
    existingExpertVoteWithRank &&
    existingExpertVoteWithRank.releaseId !== releaseId
  ) {
    throw new ApiError(400, 'You have already assigned this rank to another release this week');
  }

  const { data: existingVote } = await supabase
    .from('expert_votes')
    .select('*')
    .eq('djId', djProfile.id)
    .eq('releaseId', releaseId)
    .eq('weekStart', weekStartIso)
    .maybeSingle();

  let updatedExpertVote;
  if (existingVote) {
    const { data, error } = await supabase
      .from('expert_votes')
      .update({ rank, rating: rank, createdAt: new Date().toISOString() })
      .eq('id', existingVote.id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedExpertVote = data;
  } else {
    const { data, error } = await supabase
      .from('expert_votes')
      .insert({
        djId: djProfile.id,
        releaseId,
        rank,
        rating: rank,
        weekStart: weekStartIso,
      })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedExpertVote = data;
  }

  const response = NextResponse.json({ success: true, vote: updatedExpertVote });
  return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 20,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});