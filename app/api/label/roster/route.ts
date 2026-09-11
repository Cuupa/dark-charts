import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { attachArtistToLabel, listLabelRoster } from '@/lib/api/label-roster';

const bodySchema = z.object({
  artistId: z.string().uuid(),
});

async function requireLabel(req: NextRequest) {
  const decoded = await requireAuth(req);
  if (decoded.role !== 'LABEL') {
    throw new ApiError(403, 'Label role required');
  }
  return decoded;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 30 });
  if (rateLimited) return rateLimited;

  const { userId } = await requireLabel(req);
  const supabase = createServiceRoleSupabaseClient();
  const artists = await listLabelRoster(supabase, userId);

  const response = NextResponse.json({ success: true, artists });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,POST,OPTIONS'), req, {
    maxRequests: 30,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const { userId, isDemo } = await requireLabel(req);
  if (isDemo) throw new ApiError(403, 'Demo accounts cannot manage a roster');

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(400, 'Invalid artistId', 'VALIDATION_ERROR');

  const supabase = createServiceRoleSupabaseClient();
  const result = await attachArtistToLabel(supabase, userId, parsed.data.artistId);

  const response = NextResponse.json({ success: true, ...result });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 10,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
