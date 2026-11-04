/**
 * Unified ISO-week calendar helpers (Monday 00:00 UTC).
 * All voting windows and chart aggregation use these boundaries.
 */

export function getWeekStartMonday(date = new Date()): Date {
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** @deprecated Use getWeekStartMonday */
export function getStartOfWeek(date = new Date()): Date {
  return getWeekStartMonday(date);
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

export function getPreviousWeekStart(weekStart: Date): Date {
  const prev = new Date(weekStart);
  prev.setUTCDate(prev.getUTCDate() - 7);
  return prev;
}

/** ISO week whose voting window has fully closed (Monday 00:00 UTC). */
export function getCompletedWeekStart(date = new Date()): Date {
  return getPreviousWeekStart(getWeekStartMonday(date));
}

export function getNextMonday(date = new Date()): Date {
  const day = date.getUTCDay();
  const daysUntil = day === 0 ? 1 : 8 - day;
  const next = new Date(date);
  next.setUTCDate(date.getUTCDate() + daysUntil);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export function isoWeekToMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay();
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((dayOfWeek + 6) % 7) + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export function getIsoWeekYear(date: Date): { weekNumber: number; year: number } {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return { weekNumber, year: d.getUTCFullYear() };
}