import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resetFanCredits } from './fan-credits';

function createCreditsClient(options: {
  error?: string;
  onUpdate?: (payload: { remainingCredits: number }) => void;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table !== 'fan_profiles') {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        update: async (payload: { remainingCredits: number }) => {
          if (options.error) {
            return { error: { message: options.error } };
          }
          options.onUpdate?.(payload);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe('resetFanCredits', () => {
  it('sets remainingCredits to the budget for all fan profiles', async () => {
    let applied: { remainingCredits: number } | undefined;
    const supabase = createCreditsClient({
      onUpdate: (payload) => {
        applied = payload;
      },
    });

    await resetFanCredits(supabase, 150);
    expect(applied?.remainingCredits).toBe(150);
  });

  it('throws when the update fails', async () => {
    const supabase = createCreditsClient({ error: 'db down' });
    await expect(resetFanCredits(supabase, 150)).rejects.toThrow('db down');
  });
});
