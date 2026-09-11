import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getPublicExpert } from '@/lib/api/dj-ranking';

export const GET = withErrorHandler(async (req: NextRequest, context) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 60 });
  if (rateLimited) return rateLimited;

  const params = await context?.params;
  const id = params?.id;
  if (!id) throw new ApiError(400, 'Missing id');

  const supabase = createServiceRoleSupabaseClient();
  const expert = await getPublicExpert(supabase, id);
  if (!expert) throw new ApiError(404, 'DJ not found');

  const response = NextResponse.json({ success: true, expert });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 60,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
