import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import {
  DEMO_AUTH_COOKIE,
  buildDemoAuthUser,
  getDemoSigningSecret,
  isDemoLoginAllowed,
  isDemoRole,
} from '@/lib/auth/demoAccounts';

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

  const user = buildDemoAuthUser(role);
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, isDemo: true },
    getDemoSigningSecret(process.env),
    { expiresIn: '2h' }
  );

  logger.info('Demo login', { role: user.role, inMemory: true });

  const response = NextResponse.json({
    success: true,
    token,
    user,
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