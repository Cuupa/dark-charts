import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getPreviousWeekStart, getWeekStartMonday } from '@/lib/week';
import { runWeeklyFanBadgeEvaluation } from '@/lib/badges/weekly-fan-badges';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  const supabase = createServiceRoleSupabaseClient();
  const completedWeekStart = getPreviousWeekStart(getWeekStartMonday());
  const result = await runWeeklyFanBadgeEvaluation(
    supabase,
    completedWeekStart.toISOString()
  );

  logger.info('Weekly fan badges evaluated', {
    weekStart: completedWeekStart.toISOString(),
    ...result,
  });

  return NextResponse.json({
    success: true,
    weekStart: completedWeekStart.toISOString(),
    ...result,
  });
});
