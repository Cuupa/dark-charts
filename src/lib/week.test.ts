import { describe, it, expect } from 'vitest';
import {
  getWeekStartMonday,
  getWeekEnd,
  getPreviousWeekStart,
  getNextMonday,
  isoWeekToMonday,
  getIsoWeekYear,
  getCompletedWeekStart,
} from './week';

describe('week utilities', () => {
  it('getWeekStartMonday returns Monday 00:00 UTC', () => {
    const wednesday = new Date('2025-04-02T15:30:00.000Z');
    const monday = getWeekStartMonday(wednesday);
    expect(monday.getUTCDay()).toBe(1);
    expect(monday.toISOString()).toBe('2025-03-31T00:00:00.000Z');
  });

  it('getWeekEnd is 7 days after week start', () => {
    const start = new Date('2025-03-31T00:00:00.000Z');
    const end = getWeekEnd(start);
    expect(end.toISOString()).toBe('2025-04-07T00:00:00.000Z');
  });

  it('getPreviousWeekStart subtracts 7 days', () => {
    const start = new Date('2025-03-31T00:00:00.000Z');
    const prev = getPreviousWeekStart(start);
    expect(prev.toISOString()).toBe('2025-03-24T00:00:00.000Z');
  });

  it('getNextMonday from Wednesday points to next Monday', () => {
    const wednesday = new Date('2025-04-02T12:00:00.000Z');
    const next = getNextMonday(wednesday);
    expect(next.getUTCDay()).toBe(1);
    expect(next.toISOString()).toBe('2025-04-07T00:00:00.000Z');
  });

  it('isoWeekToMonday matches ISO week 14 2025', () => {
    const monday = isoWeekToMonday(2025, 14);
    expect(monday.toISOString()).toBe('2025-03-31T00:00:00.000Z');
  });

  it('getIsoWeekYear returns correct week for a date', () => {
    const date = new Date('2025-04-02T12:00:00.000Z');
    const { weekNumber, year } = getIsoWeekYear(date);
    expect(year).toBe(2025);
    expect(weekNumber).toBe(14);
  });

  it('getCompletedWeekStart is the previous Monday after the voting window closes', () => {
    const mondayJustAfterClose = new Date('2025-04-07T00:05:00.000Z');
    expect(getCompletedWeekStart(mondayJustAfterClose).toISOString()).toBe(
      '2025-03-31T00:00:00.000Z'
    );
  });
});