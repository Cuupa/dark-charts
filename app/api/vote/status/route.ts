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
import { getVoiceCreditsBudget } from '@/lib/system-settings';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 60 });
  if (rateLimited) return rateLimited;

  const decoded = await requireAuth(req);
  const { userId, role } = decoded;

  if (role !== 'FAN') {
    const response = NextResponse.json({ hasVoted: false });
    return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
      maxRequests: 60,
    });
  }

  const supabase = createServiceRoleSupabaseClient();
  const creditBudget = await getVoiceCreditsBudget(supabase);
  const weekStart = getStartOfWeek();

  const { data: fanProfile, error: fanError } = await supabase
    .from('fan_profiles')
    .select('id, remainingCredits')
    .eq('userId', userId)
    .maybeSingle();

  if (fanError) throw new ApiError(500, fanError.message);
  if (!fanProfile) throw new ApiError(404, 'Fan profile not found');

  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
      .eq('fanId', fanProfile.id)
      .eq('weekStart', weekStart.toISOString());

  if (error) throw new ApiError(500, error.message);

  const response = NextResponse.json({
    success: true,
    hasVoted: (count ?? 0) > 0,
    remainingCredits: fanProfile.remainingCredits,
    creditBudget,
    weekStart: weekStart.toISOString(),
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 60,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});