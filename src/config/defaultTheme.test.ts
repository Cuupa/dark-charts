import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_COLORS } from './defaultTheme';

describe('DEFAULT_THEME_COLORS', () => {
  it('matches the live darkTunes CI', () => {
    expect(DEFAULT_THEME_COLORS).toEqual({
      primary: '#6d28d9',
      secondary: '#9333ea',
      background: '#0d0d1a',
      foreground: '#f3f0ff',
      card: '#1a1a2e',
      muted: '#1a1a2e',
      accent: '#6d28d9',
      border: '#2d2d4e',
    });
  });
});
