import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { listRadioAirplayViews } from '@/lib/radio/stationRepository';

export const GET = withAdminAuth(async (req) => {
  const unmatched = req.nextUrl.searchParams.get('unmatched') === '1';
  const supabase = createServiceRoleSupabaseClient();
  const events = await listRadioAirplayViews(supabase, 300);
  const filtered = unmatched
    ? events.filter((event) => !event.artistId && !event.releaseId)
    : events;
  return NextResponse.json({ events: filtered });
});
