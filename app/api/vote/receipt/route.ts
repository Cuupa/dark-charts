import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireAuth, getStartOfWeek } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 60 });
  if (rateLimited) return rateLimited;

  const decoded = await requireAuth(req);
  const { userId, role } = decoded;

  if (role !== 'FAN') {
    const response = NextResponse.json({ votes: [] });
    return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
      maxRequests: 60,
    });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: fanProfile, error: fanError } = await supabase
    .from('fan_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (fanError) throw new ApiError(500, fanError.message);
  if (!fanProfile) throw new ApiError(404, 'Fan profile not found');

  const startOfWeek = getStartOfWeek();
  const { data: votes, error } = await supabase
    .from('votes')
    .select('*, release:releases(*, artist:artists(*))')
      .eq('fanId', fanProfile.id)
      .eq('weekStart', startOfWeek.toISOString())
    .order('createdAt', { ascending: false });

  if (error) throw new ApiError(500, error.message);

  const formattedVotes = (votes ?? []).map((vote) => ({
    id: vote.id,
    releaseId: vote.releaseId,
    allocatedVotes: vote.allocatedVotes,
    cost: vote.cost,
    createdAt: vote.createdAt,
    release: vote.release
      ? {
          id: vote.release.id,
          title: vote.release.title,
          itunesArtworkUrl: vote.release.itunesArtworkUrl,
          artist: vote.release.artist
            ? {
                id: vote.release.artist.id,
                name: vote.release.artist.name,
              }
            : null,
        }
      : null,
  }));

  const response = NextResponse.json({
    success: true,
    votes: formattedVotes,
    remainingCredits: fanProfile.remainingCredits,
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 60,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});