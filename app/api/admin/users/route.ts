import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (req) => {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
  const skip = (page - 1) * limit;
  const supabase = createServiceRoleSupabaseClient();

  const { data: users, error } = await supabase
    .from('users')
    .select(
      'id, email, role, isSuspended, createdAt, fanProfile:fan_profiles(nickname, remainingCredits), djProfile:dj_profiles(expertStatus, expertRequested, reputationScore)'
    )
    .order('createdAt', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) throw new ApiError(500, error.message);

  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) throw new ApiError(500, countError.message);

  const total = count ?? 0;

  return NextResponse.json({
    users: users ?? [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { action, userId, role, credits } = body ?? {};

  if (!action || !userId) {
    throw new ApiError(400, 'Missing action or userId');
  }

  const supabase = createServiceRoleSupabaseClient();
  let updatedUser: unknown;

  if (action === 'update_role' && role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else if (action === 'reset_credits' && credits !== undefined) {
    const { data, error } = await supabase
      .from('fan_profiles')
      .update({ remainingCredits: credits })
      .eq('userId', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else if (action === 'suspend') {
    const { data, error } = await supabase
      .from('users')
      .update({ isSuspended: true })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else if (action === 'unsuspend') {
    const { data, error } = await supabase
      .from('users')
      .update({ isSuspended: false })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else if (action === 'set_expert_status') {
    const expertStatus = body.expertStatus;
    if (typeof expertStatus !== 'boolean') {
      throw new ApiError(400, 'expertStatus must be a boolean');
    }
    const { data, error } = await supabase
      .from('dj_profiles')
      .update({
        expertStatus,
        ...(expertStatus ? { expertRequested: false } : {}),
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else if (action === 'set_reputation') {
    const reputation = body.reputation;
    if (typeof reputation !== 'number' || reputation < 0) {
      throw new ApiError(400, 'reputation must be a non-negative number');
    }
    const { data, error } = await supabase
      .from('dj_profiles')
      .update({ reputationScore: reputation, updatedAt: new Date().toISOString() })
      .eq('userId', userId)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    updatedUser = data;
  } else {
    throw new ApiError(400, 'Invalid action');
  }

  await supabase.from('audit_logs').insert({
    adminId,
    action: `USER_ACTION_${String(action).toUpperCase()}`,
    details: { userId, role, credits },
  });

  return NextResponse.json({ success: true, user: updatedUser });
});