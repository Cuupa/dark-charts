import { describe, expect, it } from 'vitest';
import { normalizeName } from './normalizeTitle';

describe('normalizeName', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeName('Nöther')).toBe('nother');
  });

  it('drops featuring tails', () => {
    expect(normalizeName('Artist feat. Guest')).toBe('artist');
    expect(normalizeName('Artist ft. Guest')).toBe('artist');
    expect(normalizeName('Artist featuring Guest')).toBe('artist');
  });

  it('drops remix brackets', () => {
    expect(normalizeName('GODSLAYER (Club Remix)')).toBe('godslayer');
  });

  it('drops a leading the', () => {
    expect(normalizeName('The Sisters of Mercy')).toBe('sisters of mercy');
  });

  it('collapses whitespace', () => {
    expect(normalizeName('  Dark   Wave  ')).toBe('dark wave');
  });
});
