import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errors';
import { requireCronAuth } from '@/lib/cronAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { deleteInactiveAccounts } from '@/lib/api/account-purge';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (req: NextRequest) => {
  requireCronAuth(req);

  const supabase = createServiceRoleSupabaseClient();
  const result = await deleteInactiveAccounts(supabase);

  logger.info('Inactive accounts purged', result);

  return NextResponse.json({ success: true, ...result });
});
