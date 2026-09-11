import { describe, expect, it } from 'vitest';
import { buildPersonalChart, chartMetric, chartFilterHref } from './presentation';
import type { Track } from '@/types';

const track = (id: string, score: number, chartType: 'fan' | 'expert'): Track => ({ id, title: id, artist: id, genres: ['Industrial'], rank: 1, chartType, score });

describe('chart presentation contract', () => {
  it('merges both pools by release identity and applies the selected weight', () => {
    const fan = [track('a', 100, 'fan'), track('b', 10, 'fan')];
    const club = [track('a', 10, 'expert'), track('b', 100, 'expert')];
    expect(buildPersonalChart(fan, club, 90)[0].id).toBe('a');
    expect(buildPersonalChart(fan, club, 10)[0].id).toBe('b');
    expect(buildPersonalChart(fan, club, 50)).toHaveLength(2);
    expect(fan[0].rank).toBe(1);
  });
  it('does not invent votes or weeks for missing data', () => {
    expect(chartMetric({ ...track('a', 0, 'fan'), score: undefined })).toBeNull();
    expect(chartMetric(track('a', 0, 'fan'))).toBe(0);
  });
  it('keeps genre and subgenre when switching chart source', () => {
    expect(chartFilterHref('club', 'Dark Electro', 'Industrial')).toBe('/genre/dark-electro/industrial?pillar=club');
    expect(chartFilterHref('fan', null, null)).toBe('/charts/fan');
  });
});
