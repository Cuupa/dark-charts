import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { chartAggregationService } from '@/backend/services/ChartAggregationService';
import { logger } from '@/lib/logger';
import { getCompletedWeekStart } from '@/lib/week';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Cron runs Monday 00:05 UTC — aggregate the ISO week that just closed
  const weekStart = getCompletedWeekStart();

  await chartAggregationService.aggregateChartsForWeek(weekStart);
  logger.info('Weekly charts aggregated successfully', { weekStart: weekStart.toISOString() });

  return NextResponse.json({
    success: true,
    message: 'Charts aggregated successfully',
    weekStart: weekStart.toISOString(),
  });
});