import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  tryCreateBrowserSupabaseClient: () => null,
}));

const loginDemo = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginDemo,
    isLoading: false,
  }),
}));

import { CentralLoginForm } from './CentralLoginForm';

describe('CentralLoginForm demo admin', () => {
  it('offers a demo admin button that signs in as ADMIN', async () => {
    loginDemo.mockResolvedValue(undefined);
    render(<CentralLoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'auth.demoAdmin' }));
    await waitFor(() => expect(loginDemo).toHaveBeenCalledWith('ADMIN'));
  });
});
