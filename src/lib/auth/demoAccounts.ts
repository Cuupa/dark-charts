export const DEMO_ROLES = ['FAN', 'DJ', 'BAND', 'LABEL', 'ADMIN'] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEMO_AUTH_COOKIE = 'dc-demo-token';

export const LOCAL_DEMO_JWT_SECRET = 'dark-charts-local-demo-do-not-use-in-production';

export const DEMO_USER_IDS: Record<DemoRole, string> = {
  FAN: '00000000-0000-4000-a000-000000000001',
  DJ: '00000000-0000-4000-a000-000000000002',
  BAND: '00000000-0000-4000-a000-000000000003',
  LABEL: '00000000-0000-4000-a000-000000000004',
  ADMIN: '00000000-0000-4000-a000-000000000005',
};

export const DEMO_ACCOUNTS: ReadonlyArray<{
  role: DemoRole;
  email: string;
  profileData: Record<string, string>;
}> = [
  {
    role: 'FAN',
    email: 'demo-fan@darkcharts.demo',
    profileData: { nickname: 'Demo Fan' },
  },
  {
    role: 'DJ',
    email: 'demo-dj@darkcharts.demo',
    profileData: { bio: 'Demo DJ account for testing' },
  },
  {
    role: 'BAND',
    email: 'demo-band@darkcharts.demo',
    profileData: {},
  },
  {
    role: 'LABEL',
    email: 'demo-label@darkcharts.demo',
    profileData: { companyName: 'Demo Records' },
  },
  {
    role: 'ADMIN',
    email: 'demo-admin@darkcharts.demo',
    profileData: {},
  },
];

const ADMIN_ROLES = new Set(['ADMIN', 'admin', 'editor']);

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && (DEMO_ROLES as readonly string[]).includes(value);
}

export function isDemoLoginAllowed(env: {
  NODE_ENV?: string;
  ALLOW_DEMO_LOGIN?: string;
}): boolean {
  if (env.NODE_ENV === 'production' && env.ALLOW_DEMO_LOGIN !== '1') return false;
  return true;
}

export function getDemoSigningSecret(env: {
  NODE_ENV?: string;
  ALLOW_DEMO_LOGIN?: string;
  JWT_SECRET?: string;
}): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (!isDemoLoginAllowed(env)) {
    throw new Error('JWT_SECRET is required when demo login is disabled');
  }
  return LOCAL_DEMO_JWT_SECRET;
}

export interface DemoAuthUser {
  id: string;
  email: string;
  role: DemoRole;
  isDemo: true;
  emailVerified: true;
  trustLevel: number;
  authProvider: 'demo';
  fanProfile: { nickname: string; credits: number; remainingCredits: number } | null;
  djProfile: { bio: string; expertStatus: boolean; reputationScore: number } | null;
  bandProfile: Record<string, never> | null;
  labelProfile: { companyName: string } | null;
}

export function buildDemoAuthUser(role: DemoRole): DemoAuthUser {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role);
  if (!account) {
    throw new Error(`Unknown demo role: ${role}`);
  }
  return {
    id: DEMO_USER_IDS[role],
    email: account.email,
    role,
    isDemo: true,
    emailVerified: true,
    trustLevel: 2,
    authProvider: 'demo',
    fanProfile:
      role === 'FAN'
        ? {
            nickname: account.profileData.nickname ?? 'Demo Fan',
            credits: 150,
            remainingCredits: 150,
          }
        : null,
    djProfile:
      role === 'DJ'
        ? {
            bio: account.profileData.bio ?? 'Demo DJ',
            expertStatus: false,
            reputationScore: 0,
          }
        : null,
    bandProfile: role === 'BAND' ? {} : null,
    labelProfile:
      role === 'LABEL' ? { companyName: account.profileData.companyName ?? 'Demo Label' } : null,
  };
}

export function resolveDemoAuthFromPayload(
  payload: Record<string, unknown> | null
): {
  userId: string;
  email: string;
  role: DemoRole;
  isDemo: true;
  source: 'jwt';
} | null {
  if (!payload || payload.isDemo !== true) return null;
  if (!isDemoRole(payload.role)) return null;
  if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') return null;
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    isDemo: true,
    source: 'jwt',
  };
}

export function payloadGrantsDemoAdmin(payload: Record<string, unknown> | null): boolean {
  if (!payload) return false;
  if (payload.isDemo !== true) return false;
  return typeof payload.role === 'string' && ADMIN_ROLES.has(payload.role);
}

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyHs256Jwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToBytes(parts[2]);
    const ok = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!ok) return null;

    const json: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    const payload = json as Record<string, unknown>;
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function resolveDemoToken(
  token: string | undefined,
  env: { NODE_ENV?: string; ALLOW_DEMO_LOGIN?: string; JWT_SECRET?: string }
): Promise<ReturnType<typeof resolveDemoAuthFromPayload>> {
  if (!token || !isDemoLoginAllowed(env)) return null;
  const payload = await verifyHs256Jwt(token, getDemoSigningSecret(env));
  return resolveDemoAuthFromPayload(payload);
}

export async function demoCookieGrantsAdmin(
  token: string | undefined,
  env: { NODE_ENV?: string; ALLOW_DEMO_LOGIN?: string; JWT_SECRET?: string }
): Promise<boolean> {
  const resolved = await resolveDemoToken(token, env);
  return resolved?.role === 'ADMIN';
}
