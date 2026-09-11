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

const bodySchema = z.object({
  displayName: z.string().trim().max(80).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  soundcloudLink: z.string().trim().max(200).nullable().optional(),
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'PATCH,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const { userId, role } = await requireAuth(req);
  if (role !== 'DJ') throw new ApiError(403, 'DJ role required');

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid profile fields', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from('dj_profiles')
    .update({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId);

  if (error) throw new ApiError(500, error.message);

  const response = NextResponse.json({ success: true });
  return setRateLimitHeaders(applyCorsToResponse(response, 'PATCH,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 20,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'PATCH,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});
