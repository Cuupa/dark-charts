import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { formatPublicChartEntries } from '@/lib/chart-format';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { maxRequests: 120 });
  if (rateLimited) return rateLimited;

  const supabase = createServiceRoleSupabaseClient();

  const { data: latestEntry } = await supabase
    .from('chart_entries')
    .select('weekStart')
    .eq('chartType', 'combined')
    .order('weekStart', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestEntry?.weekStart) {
    const response = NextResponse.json({ success: true, entries: [], count: 0 });
    return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
      maxRequests: 120,
    });
  }

  const { data: chartEntries, error } = await supabase
    .from('chart_entries')
    .select('*, release:releases(*, artist:artists(*))')
    .eq('chartType', 'combined')
    .eq('weekStart', latestEntry.weekStart)
    .order('placement', { ascending: true });

  if (error) {
    throw new ApiError(500, error.message);
  }

  const formattedEntries = formatPublicChartEntries(chartEntries);
  const response = NextResponse.json({
    success: true,
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