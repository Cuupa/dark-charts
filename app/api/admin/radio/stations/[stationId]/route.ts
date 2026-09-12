import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { RADIO_METADATA_MODES } from '@/lib/radio/constants';
import { deleteStation, updateStation } from '@/lib/radio/stationRepository';

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  streamUrl: z.string().url().nullable().optional(),
  nowPlayingUrl: z.string().url().nullable().optional(),
  country: z.string().trim().max(8).nullable().optional(),
  monitorEnabled: z.boolean().optional(),
  legalHold: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  probeIntervalSeconds: z.number().int().min(15).max(600).optional(),
  metadataMode: z.enum(RADIO_METADATA_MODES).optional(),
  consecutiveFailures: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = withAdminAuth(async (req, adminId, context) => {
  const stationId = (await context?.params)?.stationId;
  if (!stationId) throw new ApiError(400, 'Missing station id');
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(400, 'Invalid station patch', 'VALIDATION_ERROR');
  const supabase = createServiceRoleSupabaseClient();
  const station = await updateStation(supabase, stationId, parsed.data);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_STATION_UPDATE',
    details: { stationId, patch: parsed.data },
  });
  return NextResponse.json({ station });
});

export const DELETE = withAdminAuth(async (req, adminId, context) => {
  const stationId = (await context?.params)?.stationId;
  if (!stationId) throw new ApiError(400, 'Missing station id');
  const supabase = createServiceRoleSupabaseClient();
  await deleteStation(supabase, stationId);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_STATION_DELETE',
    details: { stationId },
  });
  return NextResponse.json({ success: true });
});
