import { describe, it, expect } from 'vitest';
import { evaluateFanBadges } from './fan-badge-eval';

const WEEK = '2026-09-07T00:00:00.000Z';

describe('evaluateFanBadges', () => {
  it('awards Thronwächter when the fan voted for this week’s #1', () => {
    const badges = evaluateFanBadges({
      votedReleaseIds: ['r-top', 'r-other'],
      fanChartNumberOneId: 'r-top',
      weekStartsVoted: [WEEK],
      currentWeekStart: WEEK,
      genresThisWeek: ['Gothic Rock'],
    });
    expect(badges).toContain('thronwaechter');
  });

  it('awards Dauergast after four consecutive weeks of voting', () => {
    const badges = evaluateFanBadges({
      votedReleaseIds: ['r1'],
      fanChartNumberOneId: 'r-top',
      weekStartsVoted: [
        '2026-08-17T00:00:00.000Z',
        '2026-08-24T00:00:00.000Z',
        '2026-08-31T00:00:00.000Z',
        WEEK,
      ],
      currentWeekStart: WEEK,
      genresThisWeek: ['Gothic Rock'],
    });
    expect(badges).toContain('dauergast');
  });

  it('awards Genre-Scout at five distinct genres', () => {
    const badges = evaluateFanBadges({
      votedReleaseIds: ['r1'],
      fanChartNumberOneId: null,
      weekStartsVoted: [WEEK],
      currentWeekStart: WEEK,
      genresThisWeek: ['Gothic Rock', 'Dark Wave', 'EBM', 'Doom Metal', 'Neofolk'],
    });
    expect(badges).toContain('genre_scout');
  });

  it('awards nothing without matching criteria', () => {
    expect(
      evaluateFanBadges({
        votedReleaseIds: ['r1'],
        fanChartNumberOneId: 'r-top',
        weekStartsVoted: [WEEK],
        currentWeekStart: WEEK,
        genresThisWeek: ['Gothic Rock'],
      })
    ).toEqual([]);
  });
});
