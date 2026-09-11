import { isSupabaseEnvConfigured } from '@/lib/supabase/isConfigured';

/** Set explicitly for previews. Auto preserves existing unconfigured checkouts. */
export function isDemoMode(): boolean {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE;
  if (mode === 'demo') return true;
  if (mode === 'live') return false;
  return !isSupabaseEnvConfigured();
}
