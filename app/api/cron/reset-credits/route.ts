import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getVoiceCreditsBudget } from '@/lib/system-settings';
import { resetFanCredits } from '@/lib/api/fan-credits';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  const supabase = createServiceRoleSupabaseClient();
  const budget = await getVoiceCreditsBudget(supabase);
  await resetFanCredits(supabase, budget);

  logger.info('Fan voice credits reset', { budget });

  return NextResponse.json({
    success: true,
    message: 'Fan credits reset',
    budget,
  });
});
