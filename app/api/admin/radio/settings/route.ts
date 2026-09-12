import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { radioMonitorSettingsSchema } from '@/lib/radio/constants';
import { getRadioMonitorSettings, updateRadioMonitorSettings } from '@/lib/radio/settings';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const settings = await getRadioMonitorSettings(supabase);
  return NextResponse.json({ settings });
});

export const PUT = withAdminAuth(async (req, adminId) => {
  const parsed = radioMonitorSettingsSchema.partial().safeParse(await req.json());
  if (!parsed.success) throw new ApiError(400, 'Invalid radio monitor settings', 'VALIDATION_ERROR');
  const supabase = createServiceRoleSupabaseClient();
  const settings = await updateRadioMonitorSettings(supabase, parsed.data);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_MONITOR_SETTINGS',
    details: parsed.data,
  });
  return NextResponse.json({ settings });
});
