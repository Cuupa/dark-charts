import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveRedirectPath } from '@/lib/auth/resolveRedirectPath';
import {
  DEMO_AUTH_COOKIE,
  demoCookieGrantsAdmin,
  isDemoLoginAllowed,
} from '@/lib/auth/demoAccounts';
import { isSupabaseEnvConfigured } from '@/lib/supabase/isConfigured';

const ADMIN_ROLES = new Set(['ADMIN', 'admin', 'editor']);

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

async function hasDemoAdminAccess(request: NextRequest): Promise<boolean> {
  if (!isDemoLoginAllowed(process.env)) return false;
  return demoCookieGrantsAdmin(
    request.cookies.get(DEMO_AUTH_COOKIE)?.value,
    process.env.JWT_SECRET
  );
}

function redirectToLoginUnauthorized(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('error', 'unauthorized');
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isAdminRoute && !isLoginPage) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseEnvConfigured()) {
    if (isAdminRoute) {
      if (await hasDemoAdminAccess(request)) {
        return NextResponse.next({ request });
      }
      return redirectToLogin(request);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  if (isLoginPage && user && role) {
    const returnTo = request.nextUrl.searchParams.get('returnTo');
    const error = request.nextUrl.searchParams.get('error');
    if (error === 'unauthorized') {
      return response;
    }

    const destination = resolveRedirectPath(role, returnTo);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute && !user) {
    if (await hasDemoAdminAccess(request)) {
      return response;
    }
    return redirectToLogin(request);
  }

  if (isAdminRoute && user && (!role || !ADMIN_ROLES.has(role))) {
    return redirectToLoginUnauthorized(request);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};