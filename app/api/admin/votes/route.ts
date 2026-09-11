import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getStartOfWeek } from '@/lib/api-auth';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (req) => {
  const supabase = createServiceRoleSupabaseClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'expert' ? 'expert' : 'fan';
  const weekOnly = searchParams.get('weekOnly') !== 'false';
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);
  const weekStart = getStartOfWeek();

  if (type === 'expert') {
    let query = supabase
      .from('expert_votes')
      .select(
        '*, dj:dj_profiles(id, user:users(email)), release:releases(title, artist:artists(name))',
        { count: 'exact' }
      )
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (weekOnly) query = query.eq('weekStart', weekStart.toISOString());

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({
      type: 'expert',
      votes: (data ?? []).map((vote) => ({
        id: vote.id,
        rating: vote.rating,
        rank: vote.rank,
        createdAt: vote.createdAt,
        userEmail: vote.dj?.user?.email ?? null,
        releaseTitle: vote.release?.title ?? null,
        artistName: vote.release?.artist?.name ?? null,
      })),
      total: count ?? 0,
      limit,
      offset,
    });
  }

  let query = supabase
    .from('votes')
    .select(
      '*, fan:fan_profiles(id, nickname, user:users(email)), release:releases(title, artist:artists(name))',
      { count: 'exact' }
    )
    .order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (weekOnly) query = query.eq('weekStart', weekStart.toISOString());

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, error.message);

  return NextResponse.json({
    type: 'fan',
    votes: (data ?? []).map((vote) => ({
      id: vote.id,
      allocatedVotes: vote.allocatedVotes,
      cost: vote.cost,
      credits: vote.credits,
      createdAt: vote.createdAt,
      userEmail: vote.fan?.user?.email ?? null,
      nickname: vote.fan?.nickname ?? null,
      releaseTitle: vote.release?.title ?? null,
      artistName: vote.release?.artist?.name ?? null,
    })),
    total: count ?? 0,
    limit,
    offset,
  });
});