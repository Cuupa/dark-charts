export const DEMO_ROLES = ['FAN', 'DJ', 'BAND', 'LABEL', 'ADMIN'] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEMO_AUTH_COOKIE = 'dc-demo-token';

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

export async function demoCookieGrantsAdmin(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;
  const payload = await verifyHs256Jwt(token, secret);
  return payloadGrantsDemoAdmin(payload);
}
