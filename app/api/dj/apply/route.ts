import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  const { userId, role, isDemo } = await requireAuth(req);
  if (role !== 'DJ') {
    throw new ApiError(403, 'DJ role required');
  }
  if (isDemo) {
    throw new ApiError(403, 'Demo accounts cannot apply for expert status');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from('dj_profiles')
    .select('id, expertStatus, expertRequested')
    .eq('userId', userId)
    .maybeSingle();

  if (profileError) throw new ApiError(500, profileError.message);
  if (!profile) throw new ApiError(404, 'DJ profile not found');
  if (profile.expertStatus) {
    throw new ApiError(409, 'Already an expert', 'ALREADY_EXPERT');
  }

  const { error } = await supabase
    .from('dj_profiles')
    .update({ expertRequested: true, updatedAt: new Date().toISOString() })
    .eq('id', profile.id);

  if (error) throw new ApiError(500, error.message);

  const response = NextResponse.json({ success: true, expertRequested: true });
  return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 5,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
