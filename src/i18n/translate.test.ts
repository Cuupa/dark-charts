import { describe, it, expect } from 'vitest';
import { interpolate, lookupMessage } from './translate';

describe('interpolate', () => {
  it('fills named slots', () => {
    expect(interpolate('{fan}% crowd · {expert}% clubs', { fan: 55, expert: 45 })).toBe(
      '55% crowd · 45% clubs'
    );
  });
});

describe('lookupMessage', () => {
  const catalog = {
    de: { 'nav.home': 'Listen', 'chart.weightsFormula': '{fan}% Szene' },
    en: { 'nav.home': 'Lists', 'chart.weightsFormula': '{fan}% crowd' },
  };

  it('uses the active language', () => {
    expect(lookupMessage(catalog, 'de', 'nav.home')).toBe('Listen');
  });

  it('falls back to de then the key', () => {
    expect(lookupMessage(catalog, 'en', 'missing')).toBe('missing');
  });
});
