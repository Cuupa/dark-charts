import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { applyCorsToResponse, handleCors } from '@/lib/api-middleware';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  if (cors) return cors;

  const decoded = await requireAuth(req);
  const supabase = createServiceRoleSupabaseClient();

  const { data: user, error } = await supabase
    .from('users')
    .select(
      'id, email, role, emailVerified, trustLevel, authProvider, createdAt, fanProfile:fan_profiles(id, nickname, credits, remainingCredits, avatarUrl), djProfile:dj_profiles(id, bio, displayName, soundcloudLink, expertStatus, expertRequested, reputationScore), bandProfile:band_profiles(id, artistId, members), labelProfile:label_profiles(id, companyName, website)'
    )
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!user) throw new ApiError(404, 'User not found');

  const response = NextResponse.json({
    success: true,
    user: {
      ...user,
      isDemo: decoded.isDemo ?? false,
    },
  });

  return applyCorsToResponse(response, 'GET,OPTIONS');
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'GET,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});