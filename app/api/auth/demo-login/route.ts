import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  DEMO_ACCOUNTS,
  DEMO_AUTH_COOKIE,
  isDemoLoginAllowed,
  isDemoRole,
} from '@/lib/auth/demoAccounts';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return secret;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  if (!isDemoLoginAllowed(process.env)) {
    throw new ApiError(403, 'Demo login is disabled in production');
  }

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { role } = body ?? {};
  if (!isDemoRole(role)) {
    throw new ApiError(400, 'Invalid role. Must be one of: FAN, DJ, BAND, LABEL, ADMIN');
  }
  const demoConfig = DEMO_ACCOUNTS.find((a) => a.role === role);

  if (!demoConfig) {
    throw new ApiError(400, 'Invalid role. Must be one of: FAN, DJ, BAND, LABEL, ADMIN');
  }

  const supabase = createServiceRoleSupabaseClient();

  let { data: user } = await supabase
    .from('users')
    .select('*, fanProfile:fan_profiles(*), djProfile:dj_profiles(*), bandProfile:band_profiles(*), labelProfile:label_profiles(*)')
    .eq('email', demoConfig.email)
    .maybeSingle();

  if (!user) {
    const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: demoConfig.email,
        passwordHash,
        role: demoConfig.role,
        emailVerified: true,
        trustLevel: 2,
        authProvider: 'demo',
      })
      .select()
      .single();

    if (createError || !createdUser) {
      throw new ApiError(500, 'Failed to create demo account');
    }

    if (demoConfig.role === 'FAN') {
      await supabase.from('fan_profiles').insert({
        userId: createdUser.id,
        nickname: demoConfig.profileData.nickname ?? 'Demo Fan',
        credits: 150,
        remainingCredits: 150,
      });
    } else if (demoConfig.role === 'DJ') {
      await supabase.from('dj_profiles').insert({
        userId: createdUser.id,
        bio: demoConfig.profileData.bio ?? 'Demo DJ',
        expertStatus: false,
        reputationScore: 0,
      });
    } else if (demoConfig.role === 'LABEL') {
      await supabase.from('label_profiles').insert({
        userId: createdUser.id,
        companyName: demoConfig.profileData.companyName ?? 'Demo Label',
      });
    }

    const refetch = await supabase
      .from('users')
      .select('*, fanProfile:fan_profiles(*), djProfile:dj_profiles(*), bandProfile:band_profiles(*), labelProfile:label_profiles(*)')
      .eq('email', demoConfig.email)
      .maybeSingle();

    user = refetch.data ?? undefined;
  }

  if (!user) {
    throw new ApiError(500, 'Failed to create demo account');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, isDemo: true },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  logger.info('Demo login', { role: demoConfig.role });

  const response = NextResponse.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isDemo: true,
      fanProfile: user.fanProfile ?? null,
      djProfile: user.djProfile ?? null,
      bandProfile: user.bandProfile ?? null,
      labelProfile: user.labelProfile ?? null,
    },
  });
  response.cookies.set(DEMO_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 2,
  });

  return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 20,
  });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,DELETE,OPTIONS');
  if (cors) return cors;
  const response = NextResponse.json({ success: true });
  response.cookies.set(DEMO_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return applyCorsToResponse(response, 'POST,DELETE,OPTIONS');
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,DELETE,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});