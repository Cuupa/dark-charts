import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { searchCatalog } from '@/lib/api/catalog';

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 40 });
  if (rateLimited) return rateLimited;

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'Query must be at least 2 characters', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await searchCatalog(supabase, parsed.data.q, 'all', 20);

  const response = NextResponse.json({
    query: result.query,
    songs: result.songs,
    artists: result.artists,
  });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 40,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
