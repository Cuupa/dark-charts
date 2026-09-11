import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('LanguageSwitcher', () => {
  it('shows DE and EN and marks the active language', () => {
    render(
      <LanguageProvider initialLanguage="de">
        <LanguageSwitcher />
      </LanguageProvider>
    );
    expect(screen.getByRole('button', { name: /deutsch/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /englisch/i }).getAttribute('aria-pressed')).toBe('false');
  });
});
