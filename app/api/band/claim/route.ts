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
import { claimBandArtist } from '@/lib/api/public-catalog';

const bodySchema = z.object({
  artistId: z.string().uuid(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 30 });
  if (rateLimited) return rateLimited;

  const { userId, role } = await requireAuth(req);
  if (role !== 'BAND') {
    throw new ApiError(403, 'Band role required');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: band, error } = await supabase
    .from('band_profiles')
    .select('artistId, artist:artists(id, name)')
    .eq('userId', userId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);

  const artist = band?.artist as { id: string; name: string } | null | undefined;
  const response = NextResponse.json({
    artistId: band?.artistId ?? null,
    artistName: artist?.name ?? null,
  });
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,POST,OPTIONS'), req, {
    maxRequests: 30,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const { userId, role, isDemo } = await requireAuth(req);
  if (role !== 'BAND') {
    throw new ApiError(403, 'Band role required');
  }
  if (isDemo) {
    throw new ApiError(403, 'Demo accounts cannot claim artists');
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid artistId', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await claimBandArtist(supabase, userId, parsed.data.artistId);

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
