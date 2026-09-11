import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { purgeUserAccount } from '@/lib/api/account-purge';

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const { userId } = decoded;

  const supabase = createServiceRoleSupabaseClient();
  try {
    await purgeUserAccount(supabase, userId);
  } catch (error) {
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Failed to delete account'
    );
  }

  return NextResponse.json({ success: true, message: 'Account deleted' });
});