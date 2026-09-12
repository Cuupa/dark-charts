import { GLOBAL_SETTINGS_ID } from '@/lib/api/systemSettings';
import type { AppSupabaseClient } from '@/types/supabase-client';
import {
  parseRadioMonitorSettings,
  type RadioMonitorSettings,
  radioMonitorSettingsSchema,
} from './constants';

export async function getRadioMonitorSettings(
  db: AppSupabaseClient
): Promise<RadioMonitorSettings> {
  const { data, error } = await db
    .from('system_settings')
    .select('radioMonitor')
    .eq('id', GLOBAL_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch radio monitor settings: ${error.message}`);
  }

  return parseRadioMonitorSettings(data?.radioMonitor);
}

export async function updateRadioMonitorSettings(
  db: AppSupabaseClient,
  patch: Partial<RadioMonitorSettings>
): Promise<RadioMonitorSettings> {
  const current = await getRadioMonitorSettings(db);
  const next = radioMonitorSettingsSchema.parse({ ...current, ...patch });
  const { error } = await db
    .from('system_settings')
    .update({
      radioMonitor: next,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', GLOBAL_SETTINGS_ID);

  if (error) {
    throw new Error(`Failed to update radio monitor settings: ${error.message}`);
  }
  return next;
}
