import { describe, it, expect } from 'vitest';
import { INACTIVE_RETENTION_MONTHS, isAccountInactive } from './account-purge';

describe('isAccountInactive', () => {
  const now = new Date('2026-09-11T00:00:00.000Z');

  it('uses a 24-month window', () => {
    expect(INACTIVE_RETENTION_MONTHS).toBe(24);
  });

  it('treats activity within 24 months as active', () => {
    expect(isAccountInactive('2025-09-12T00:00:00.000Z', now)).toBe(false);
  });

  it('treats older activity as inactive', () => {
    expect(isAccountInactive('2024-09-10T00:00:00.000Z', now)).toBe(true);
  });
});
