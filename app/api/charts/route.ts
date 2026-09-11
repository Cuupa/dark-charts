import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { formatChartEntry } from '@/lib/chart-format';
import { getStartOfWeek } from '@/lib/api-auth';
import { mainGenreChartKey } from '@/lib/genre-charts';
import { MainGenre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';
import { getItunesChartResponse } from '@/lib/charts/itunesChartFallback';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  type: z.enum(['fan', 'expert', 'streaming', 'combined', 'airplay']),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  completed: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  genre: z.string().optional(),
  mainGenre: z.string().optional(),
});

async function fetchChartsFromDatabase(
  type: 'fan' | 'expert' | 'streaming' | 'combined' | 'airplay',
  limitNum: number,
  completed: boolean | undefined,
  genre: string | undefined,
  mainGenre: string | undefined
) {
  const supabase = tryCreateServiceRoleSupabaseClient();
  if (!supabase) return null;

  let genreFilter: string | null = null;
  if (genre) {
    genreFilter = genre;
  } else if (mainGenre) {
    const resolved = mainGenre as MainGenre;
    if (resolved in mainGenreMap) {
      genreFilter = mainGenreChartKey(resolved);
    }
  }

  let targetWeekStart = getStartOfWeek();

  if (completed) {
    let latestQuery = supabase
      .from('chart_entries')
      .select('weekStart')
      .eq('chartType', type);

    if (genreFilter) {
      latestQuery = latestQuery.eq('genre', genreFilter);
    } else {
      latestQuery = latestQuery.is('genre', null);
    }

    const { data: latestEntry } = await latestQuery
      .order('weekStart', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEntry?.weekStart) {
      targetWeekStart = new Date(latestEntry.weekStart);
    } else {
      targetWeekStart.setDate(targetWeekStart.getDate() - 7);
    }
  }

  let chartQuery = supabase
    .from('chart_entries')
    .select('*, release:releases(*, artist:artists(*))')
    .eq('chartType', type)
    .eq('weekStart', targetWeekStart.toISOString());

  if (genreFilter) {
    chartQuery = chartQuery.eq('genre', genreFilter);
  } else {
    chartQuery = chartQuery.is('genre', null);
  }

  const { data: chartEntries, error } = await chartQuery
    .order('placement', { ascending: true })
    .limit(limitNum);

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!chartEntries?.length) return null;

  return chartEntries.map((entry) => formatChartEntry(entry));
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

  const { type, limit: limitNum, completed, genre, mainGenre } = parseResult.data;

  try {
    const dbEntries = await fetchChartsFromDatabase(
      type,
      limitNum,
      completed,
      genre,
      mainGenre
    );

    if (dbEntries && dbEntries.length > 0) {
      const response = NextResponse.json({
        success: true,
        chartType: type,
        entries: dbEntries,
        count: dbEntries.length,
        source: 'database',
      });
      return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
        maxRequests: 120,
      });
    }
  } catch (error) {
    if (error instanceof ApiError && error.status !== 500) {
      throw error;
    }
    logger.warn('Database chart fetch failed, falling back to iTunes', { error });
  }

  if (type === 'streaming' || type === 'airplay') {
    const empty = NextResponse.json({
      success: true,
      chartType: type,
      entries: [],
      count: 0,
      source: 'database',
    });
    return setRateLimitHeaders(applyCorsToResponse(empty, 'GET,OPTIONS'), req, {
      maxRequests: 120,
    });
  }

  const itunesPayload = await getItunesChartResponse({
    type,
    limit: limitNum,
    genre,
    mainGenre,
  });

  const response = NextResponse.json(itunesPayload);
  return setRateLimitHeaders(applyCorsToResponse(response, 'GET,OPTIONS'), req, {
    maxRequests: 120,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});