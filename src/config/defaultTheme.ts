import type { ThemeConfig } from '@/config/themeConfig';

export const DEFAULT_THEME_COLORS: NonNullable<ThemeConfig['colors']> = {
  primary: '#6d28d9',
  secondary: '#9333ea',
  background: '#0d0d1a',
  foreground: '#f3f0ff',
  card: '#1a1a2e',
  muted: '#1a1a2e',
  accent: '#6d28d9',
  border: '#2d2d4e',
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: DEFAULT_THEME_COLORS,
};
