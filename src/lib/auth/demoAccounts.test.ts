import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  DEMO_ACCOUNTS,
  DEMO_AUTH_COOKIE,
  DEMO_ROLES,
  DEMO_USER_IDS,
  buildDemoAuthUser,
  getDemoSigningSecret,
  isDemoLoginAllowed,
  isDemoRole,
  payloadGrantsDemoAdmin,
  resolveDemoAuthFromPayload,
  verifyHs256Jwt,
} from './demoAccounts';

describe('demo accounts', () => {
  it('includes an ADMIN preview account', () => {
    expect(DEMO_ROLES).toContain('ADMIN');
    expect(DEMO_ACCOUNTS.some((account) => account.role === 'ADMIN')).toBe(true);
    expect(DEMO_ACCOUNTS.find((account) => account.role === 'ADMIN')?.email).toBe(
      'demo-admin@darkcharts.demo'
    );
  });

  it('accepts ADMIN as a demo role', () => {
    expect(isDemoRole('ADMIN')).toBe(true);
    expect(isDemoRole('FAN')).toBe(true);
    expect(isDemoRole('editor')).toBe(false);
  });
});

describe('isDemoLoginAllowed', () => {
  it('is on in development', () => {
    expect(isDemoLoginAllowed({ NODE_ENV: 'development' })).toBe(true);
  });

  it('is off in production unless ALLOW_DEMO_LOGIN=1', () => {
    expect(isDemoLoginAllowed({ NODE_ENV: 'production' })).toBe(false);
    expect(isDemoLoginAllowed({ NODE_ENV: 'production', ALLOW_DEMO_LOGIN: '1' })).toBe(true);
  });
});

describe('demo admin cookie access', () => {
  it('grants admin only for a valid demo ADMIN token', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'demo-admin@darkcharts.demo', role: 'ADMIN', isDemo: true },
      'test-secret',
      { expiresIn: '2h' }
    );
    const payload = await verifyHs256Jwt(token, 'test-secret');
    expect(payloadGrantsDemoAdmin(payload)).toBe(true);
  });

  it('rejects a demo FAN token for admin', async () => {
    const token = jwt.sign(
      { userId: 'u2', email: 'demo-fan@darkcharts.demo', role: 'FAN', isDemo: true },
      'test-secret',
      { expiresIn: '2h' }
    );
    const payload = await verifyHs256Jwt(token, 'test-secret');
    expect(payloadGrantsDemoAdmin(payload)).toBe(false);
  });

  it('rejects a tampered token', async () => {
    const token = jwt.sign({ role: 'ADMIN', isDemo: true }, 'test-secret', { expiresIn: '2h' });
    const payload = await verifyHs256Jwt(`${token}x`, 'test-secret');
    expect(payload).toBeNull();
  });

  it('uses a dedicated cookie name', () => {
    expect(DEMO_AUTH_COOKIE).toBe('dc-demo-token');
  });
});

describe('in-memory demo user', () => {
  it('uses stable ids and never needs a database row', () => {
    const admin = buildDemoAuthUser('ADMIN');
    expect(admin.id).toBe(DEMO_USER_IDS.ADMIN);
    expect(admin.email).toBe('demo-admin@darkcharts.demo');
    expect(admin.role).toBe('ADMIN');
    expect(admin.isDemo).toBe(true);
    expect(admin.fanProfile).toBeNull();
  });

  it('signs and resolves a demo session without looking up users', async () => {
    const secret = getDemoSigningSecret({ NODE_ENV: 'development' });
    const user = buildDemoAuthUser('ADMIN');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, isDemo: true },
      secret,
      { expiresIn: '2h' }
    );
    const payload = await verifyHs256Jwt(token, secret);
    expect(resolveDemoAuthFromPayload(payload)).toEqual({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      isDemo: true,
      source: 'jwt',
    });
  });

  it('falls back to a local signing secret when JWT_SECRET is missing', () => {
    expect(getDemoSigningSecret({ NODE_ENV: 'test' }).length).toBeGreaterThan(8);
  });
});
