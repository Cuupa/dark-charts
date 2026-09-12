import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import {
  createManualStation,
  getHeartbeat,
  isHeartbeatStale,
  listStations,
} from '@/lib/radio/stationRepository';

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  streamUrl: z.string().url(),
  country: z.string().trim().max(8).optional().nullable(),
  nowPlayingUrl: z.string().url().optional().nullable(),
});

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const [stations, heartbeat] = await Promise.all([
    listStations(supabase),
    getHeartbeat(supabase),
  ]);
  const monitored = stations.filter((station) => station.monitorEnabled).length;
  const dead = stations.filter((station) => station.healthStatus === 'dead').length;
  const blocked = stations.filter((station) => station.healthStatus === 'blocked').length;
  return NextResponse.json({
    stations,
    heartbeat,
    heartbeatStale: isHeartbeatStale(heartbeat?.seenAt),
    stats: {
      total: stations.length,
      monitored,
      dead,
      blocked,
    },
  });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid station', 'VALIDATION_ERROR');
  }
  const supabase = createServiceRoleSupabaseClient();
  const station = await createManualStation(supabase, parsed.data);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_STATION_CREATE',
    details: { stationId: station.id, name: station.name },
  });
  return NextResponse.json({ station }, { status: 201 });
});
