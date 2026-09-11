import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { rollupAirplayWeek } from '@/lib/airplay/airplayRepository';
import { logger } from '@/lib/logger';
import { getWeekStartMonday, getPreviousWeekStart } from '@/lib/week';

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  const weekStart = getWeekStartMonday();
  const previousWeekStart = getPreviousWeekStart(weekStart);
  const db = createServiceRoleSupabaseClient();

  const result = await rollupAirplayWeek(
    db,
    weekStart.toISOString(),
    previousWeekStart.toISOString()
  );

  logger.info('Airplay snapshots rolled up', result);

  return NextResponse.json({ success: true, ...result });
});
