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
import { formatPublicChartEntries } from '@/lib/chart-format';

const querySchema = z.object({
  year: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020).max(2099)),
  week: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(53)),
});

import { isoWeekToMonday, getWeekStartMonday } from '@/lib/week';

export { isoWeekToMonday };

export function getCurrentWeekMonday(): Date {
  return getWeekStartMonday();
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 120 });
  if (rateLimited) return rateLimited;

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parseResult = querySchema.safeParse(params);
  if (!parseResult.success) {
    throw new ApiError(400, 'Invalid parameters', 'VALIDATION_ERROR');
  }

  const { year, week } = parseResult.data;
  const weekStart = isoWeekToMonday(year, week);
  const currentMonday = getCurrentWeekMonday();

  if (weekStart >= currentMonday) {
    const isCurrent = weekStart.getTime() === currentMonday.getTime();
    throw new ApiError(
      400,
      isCurrent ? 'Cannot access currently running week' : 'Cannot access future week'
    );
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: entries, error } = await supabase
    .from('chart_entries')
    .select('*, release:releases(*, artist:artists(*))')
    .eq('weekStart', weekStart.toISOString())
    .order('placement', { ascending: true });

  if (error) {
    throw new ApiError(500, error.message);
  }

  const formattedEntries = formatPublicChartEntries(entries);
  const response = NextResponse.json({
    success: true,
    year,
    week,
    weekStart: weekStart.toISOString(),
    entries: formattedEntries,
    count: formattedEntries.length,
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});