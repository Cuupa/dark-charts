import type { SupabaseClient } from '@supabase/supabase-js';

export async function resetFanCredits(
  supabase: SupabaseClient,
  budget: number
): Promise<void> {
  const { error } = await supabase
    .from('fan_profiles')
    .update({ remainingCredits: budget, updatedAt: new Date().toISOString() });

  if (error) {
    throw new Error(`Failed to reset fan credits: ${error.message}`);
  }
}
