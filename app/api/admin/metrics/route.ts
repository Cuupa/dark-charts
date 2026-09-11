import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getStartOfWeek } from '@/lib/api-auth';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const weekStart = getStartOfWeek();

  const [
    totalUsers,
    fanCount,
    djCount,
    bandCount,
    labelCount,
    artistCount,
    releaseCount,
    votesThisWeek,
    expertVotesThisWeek,
    recentAuditLogs,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'FAN'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'DJ'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'BAND'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'LABEL'),
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('releases').select('*', { count: 'exact', head: true }),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('weekStart', weekStart.toISOString()),
    supabase
      .from('expert_votes')
      .select('*', { count: 'exact', head: true })
      .eq('weekStart', weekStart.toISOString()),
    supabase
      .from('audit_logs')
      .select('*, admin:users(email)')
      .order('createdAt', { ascending: false })
      .limit(20),
  ]);

  if (recentAuditLogs.error) throw new ApiError(500, recentAuditLogs.error.message);

  const apiHealth = {
    database: { status: 'ok', message: 'Connected' },
    spotify: {
      status:
        process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
          ? 'configured'
          : 'not_configured',
      message: process.env.SPOTIFY_CLIENT_ID
        ? 'API credentials set'
        : 'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set',
    },
    jwt: {
      status: process.env.JWT_SECRET ? 'ok' : 'error',
      message: process.env.JWT_SECRET ? 'Secret configured' : 'JWT_SECRET missing',
    },
    adminInit: {
      status: process.env.ADMIN_EMAIL ? 'configured' : 'not_configured',
      message: process.env.ADMIN_EMAIL ? 'Admin email set' : 'ADMIN_EMAIL not set',
    },
  };

  return NextResponse.json({
    metrics: {
      users: {
        total: totalUsers.count ?? 0,
        fans: fanCount.count ?? 0,
        djs: djCount.count ?? 0,
        bands: bandCount.count ?? 0,
        labels: labelCount.count ?? 0,
      },
      artists: artistCount.count ?? 0,
      releases: releaseCount.count ?? 0,
      voting: {
        fanVotesThisWeek: votesThisWeek.count ?? 0,
        expertVotesThisWeek: expertVotesThisWeek.count ?? 0,
      },
      apiHealth,
      recentAuditLogs: (recentAuditLogs.data ?? []).map((log) => ({
        id: log.id,
        action: log.action,
        adminEmail: log.admin?.email,
        details: log.details,
        createdAt: log.createdAt,
      })),
    },
  });
});