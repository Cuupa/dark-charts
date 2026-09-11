import { getPreviousWeekStart } from '@/lib/week';

export const FAN_BADGE_THRONWAECHTER = 'thronwaechter';
export const FAN_BADGE_DAUERGAST = 'dauergast';
export const FAN_BADGE_GENRE_SCOUT = 'genre_scout';

const CONSECUTIVE_WEEKS = 4;
const MIN_GENRES = 5;

export interface FanBadgeEvalInput {
  votedReleaseIds: string[];
  fanChartNumberOneId: string | null;
  weekStartsVoted: string[];
  currentWeekStart: string;
  genresThisWeek: string[];
}

export function evaluateFanBadges(input: FanBadgeEvalInput): string[] {
  const awarded: string[] = [];

  if (
    input.fanChartNumberOneId &&
    input.votedReleaseIds.includes(input.fanChartNumberOneId)
  ) {
    awarded.push(FAN_BADGE_THRONWAECHTER);
  }

  if (hasConsecutiveWeeks(input.weekStartsVoted, input.currentWeekStart, CONSECUTIVE_WEEKS)) {
    awarded.push(FAN_BADGE_DAUERGAST);
  }

  const uniqueGenres = new Set(input.genresThisWeek.filter(Boolean));
  if (uniqueGenres.size >= MIN_GENRES) {
    awarded.push(FAN_BADGE_GENRE_SCOUT);
  }

  return awarded;
}

function hasConsecutiveWeeks(
  weekStartsVoted: string[],
  currentWeekStart: string,
  count: number
): boolean {
  const voted = new Set(weekStartsVoted);
  let cursor = new Date(currentWeekStart);
  for (let i = 0; i < count; i += 1) {
    if (!voted.has(cursor.toISOString())) return false;
    cursor = getPreviousWeekStart(cursor);
  }
  return true;
}
