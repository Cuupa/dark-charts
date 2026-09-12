import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_RADIO_GENRE_TAGS } from '@/lib/radio/constants';
import { searchRadioBrowser } from '@/lib/radio/discovery/radioBrowser';
import { searchShoutcastDirectory } from '@/lib/radio/discovery/shoutcastDirectory';
import { getRadioMonitorSettings } from '@/lib/radio/settings';
import { upsertCandidates } from '@/lib/radio/stationRepository';

const bodySchema = z.object({
  source: z.enum(['radio_browser', 'shoutcast']).default('radio_browser'),
  tags: z.array(z.string().min(1)).max(20).optional(),
  limit: z.number().int().min(1).max(300).optional(),
});

export const POST = withAdminAuth(async (req, adminId) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError(400, 'Invalid discover payload', 'VALIDATION_ERROR');

  const supabase = createServiceRoleSupabaseClient();
  const settings = await getRadioMonitorSettings(supabase);
  const tags = parsed.data.tags ?? settings.genreTags ?? [...DEFAULT_RADIO_GENRE_TAGS];
  const limit = parsed.data.limit ?? 100;

  if (parsed.data.source === 'radio_browser' && !settings.discoverRadioBrowser) {
    throw new ApiError(400, 'Radio Browser discovery is disabled in settings');
  }
  if (parsed.data.source === 'shoutcast' && !settings.discoverShoutcast) {
    throw new ApiError(400, 'SHOUTcast discovery is disabled in settings');
  }

  const candidates =
    parsed.data.source === 'shoutcast'
      ? await searchShoutcastDirectory(tags, limit, {
          userAgent: settings.userAgent,
          apiKey: process.env.SHOUTCAST_API_KEY ?? '',
        })
      : await searchRadioBrowser(tags, limit, { userAgent: settings.userAgent });

  const { upserted } = await upsertCandidates(supabase, candidates);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_DISCOVER',
    details: { source: parsed.data.source, tags, upserted },
  });
  return NextResponse.json({ candidates: candidates.length, upserted });
});
