import type { AppSupabaseClient } from '@/types/supabase-client'
import type { Database } from '@/types/database'
import { calculateVoteCost } from '@/lib/math/quadratic'
import {
  getSystemSettings,
  updateSystemSettings,
} from '@/lib/api/systemSettings'
import { getStartOfWeek } from '@/lib/week'

type VoteRow = Database['public']['Tables']['votes']['Row']
type ExpertVoteRow = Database['public']['Tables']['expert_votes']['Row']

export interface FanBulkVoteResult {
  votes: VoteRow[]
  remainingCredits: number
}

export interface DjBulkVoteResult {
  votes: ExpertVoteRow[]
}

export async function isVotingPaused(
  supabase: AppSupabaseClient
): Promise<boolean> {
  const settings = await getSystemSettings(supabase)
  return settings.isVotingPaused
}

export async function setVotingPaused(
  supabase: AppSupabaseClient,
  paused: boolean
): Promise<boolean> {
  const settings = await updateSystemSettings(supabase, {
    isVotingPaused: paused,
  })
  return settings.isVotingPaused
}

export async function processFanBulkVote(
  supabase: AppSupabaseClient,
  userId: string,
  votes: Record<string, number>
): Promise<FanBulkVoteResult> {
  if (await isVotingPaused(supabase)) {
    throw new Error('Voting is currently paused')
  }

  const entries = Object.entries(votes)
  if (entries.length === 0) {
    throw new Error('No votes provided')
  }

  const settings = await getSystemSettings(supabase)
  let totalCost = 0

  for (const [, voteCount] of entries) {
    totalCost += calculateVoteCost(voteCount)
  }

  if (totalCost > settings.voiceCreditsBudget) {
    throw new Error('Budget exceeded')
  }

  const { data: fanProfile, error: fanError } = await supabase
    .from('fan_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (fanError) {
    throw new Error(`Failed to fetch fan profile: ${fanError.message}`)
  }

  if (!fanProfile) {
    throw new Error('Fan profile not found')
  }

  if (fanProfile.remainingCredits < totalCost) {
    throw new Error('Insufficient credits')
  }

  const { data: updatedFan, error: updateFanError } = await supabase
    .from('fan_profiles')
    .update({
      remainingCredits: fanProfile.remainingCredits - totalCost,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', fanProfile.id)
    .select('*')
    .single()

  if (updateFanError || !updatedFan) {
    throw new Error(
      updateFanError?.message ?? 'Failed to update fan credits'
    )
  }

  if (updatedFan.remainingCredits < 0) {
    throw new Error('Insufficient credits during transaction')
  }

  const startOfWeek = getStartOfWeek()

  const weekStartIso = startOfWeek.toISOString()

  const { count: weeklyVoteCount, error: weeklyCountError } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('fanId', fanProfile.id)
    .eq('weekStart', weekStartIso)

  if (weeklyCountError) {
    throw new Error(`Failed to check weekly vote status: ${weeklyCountError.message}`)
  }

  if ((weeklyVoteCount ?? 0) > 0) {
    throw new Error('You have already submitted your vote this week')
  }

  const now = new Date().toISOString()
  const createdVotes: VoteRow[] = []

  for (const [releaseId, voteCount] of entries) {
    const cost = calculateVoteCost(voteCount)

    const { data: existingVote, error: existingVoteError } = await supabase
      .from('votes')
      .select('*')
      .eq('fanId', fanProfile.id)
      .eq('releaseId', releaseId)
      .eq('weekStart', weekStartIso)
      .maybeSingle()

    if (existingVoteError) {
      throw new Error(
        `Failed to fetch existing vote: ${existingVoteError.message}`
      )
    }

    if (existingVote) {
      const { data: updatedVote, error: updateVoteError } = await supabase
        .from('votes')
        .update({
          allocatedVotes: voteCount,
          cost,
          votes: voteCount,
          credits: cost,
          createdAt: now,
        })
        .eq('id', existingVote.id)
        .select('*')
        .single()

      if (updateVoteError || !updatedVote) {
        throw new Error(
          updateVoteError?.message ?? 'Failed to update existing vote'
        )
      }

      createdVotes.push(updatedVote)
      continue
    }

    const { data: createdVote, error: createVoteError } = await supabase
      .from('votes')
        .insert({
          fanId: fanProfile.id,
          releaseId,
          allocatedVotes: voteCount,
          cost,
          votes: voteCount,
          credits: cost,
          weekStart: weekStartIso,
          createdAt: now,
        })
      .select('*')
      .single()

    if (createVoteError || !createdVote) {
      throw new Error(createVoteError?.message ?? 'Failed to create vote')
    }

    createdVotes.push(createdVote)
  }

  return {
    votes: createdVotes,
    remainingCredits: updatedFan.remainingCredits,
  }
}

export async function processDjBulkVote(
  supabase: AppSupabaseClient,
  userId: string,
  votes: Record<string, number>
): Promise<DjBulkVoteResult> {
  if (await isVotingPaused(supabase)) {
    throw new Error('Voting is currently paused')
  }

  const entries = Object.entries(votes)
  if (entries.length !== 10) {
    throw new Error('DJs must submit exactly 10 votes')
  }

  const { data: djProfile, error: djError } = await supabase
    .from('dj_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (djError) {
    throw new Error(`Failed to fetch DJ profile: ${djError.message}`)
  }

  if (!djProfile) {
    throw new Error('DJ profile not found')
  }

  if (!djProfile.expertStatus) {
    throw new Error('Expert status required to submit expert votes')
  }

  const startOfWeek = getStartOfWeek()

  const { error: deleteError } = await supabase
    .from('expert_votes')
    .delete()
    .eq('djId', djProfile.id)
    .eq('weekStart', startOfWeek.toISOString())

  if (deleteError) {
    throw new Error(
      `Failed to clear existing expert votes: ${deleteError.message}`
    )
  }

  const createdVotes: ExpertVoteRow[] = []

  for (const [releaseId, rank] of entries) {
    const { data: createdVote, error: createError } = await supabase
      .from('expert_votes')
        .insert({
          djId: djProfile.id,
          releaseId,
          rank,
          rating: rank,
          weekStart: startOfWeek.toISOString(),
        })
      .select('*')
      .single()

    if (createError || !createdVote) {
      throw new Error(createError?.message ?? 'Failed to create expert vote')
    }

    createdVotes.push(createdVote)
  }

  return { votes: createdVotes }
}