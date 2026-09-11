import type { ChartData, Genre, Track } from '@/types';
import { buildPersonalChart } from '@/lib/charts/presentation';

export const DEMO_EDITION = {
  weekStart: '2026-09-07T00:00:00.000Z',
  publishedAt: '2026-09-07T09:00:00.000Z',
  status: 'demo' as const,
  source: 'demo' as const,
  rulesVersion: 'preview-1',
  weights: { fan: 55, expert: 45, streaming: 0 },
};

// Catalog names come from the existing project fixtures. Scores are examples only.
const entries: Array<[string, string, Genre, number, number]> = [
  ['NEUROKLAST', 'GODSLAYER', 'Industrial', 92, 98],
  ['BLACKBOOK', 'Eternal Glory', 'Dark Synthpop', 98, 82],
  ['CIRCUIT PREACHER', 'This All Hurts', 'Dark Electro', 80, 96],
  ['AGNIS', 'Gothess', 'Dark Synthpop', 91, 79],
  ['SYNTHATTACK', 'We Are SynthAttack 2.0', 'Aggrotech', 72, 94],
  ['DEAD LIGHTS', 'Killing Time', 'Electronic Body Music', 88, 73],
  ['EXTIZE', 'Techno Viking', 'Industrial Techno', 69, 91],
  ['Pink Turns Blue', 'The AERDT - Untold Stories', 'Post Punk', 93, 57],
  ['FREAKY MIND', 'On The Hook', 'Dark Electro', 65, 88],
  ['OMNIMAR', 'The Matrix', 'Dark Synthpop', 87, 58],
  ['BASSZILLA', 'Life is HARD', 'Dark Techno', 62, 85],
  ['RROYCE', 'The Principle Of Grace', 'Future Pop', 81, 60],
  ['Seelennacht', 'April Rain', 'Dark Wave', 85, 49],
  ['Rob Zombie', 'In The Age Of Consecrated Vampire We All Get High', 'Industrial Metal', 75, 62],
  ['Crematory', 'Ravens Calling', 'Gothic Metal', 71, 66],
  ['In Strict Confidence', "Somebody Else's Dream", 'Dark Wave', 78, 52],
  ['Panzer AG', 'Sick is the One Who Adores Me', 'Aggrotech', 58, 79],
  ['Mesh', 'Hey Stranger', 'Future Pop', 79, 46],
  ['diorama', 'the same ghost', 'Gothic Rock', 76, 48],
  ['The Cult', 'Goat', 'Gothic Rock', 67, 58],
];

export const demoCatalog: Track[] = entries.map(([artist, title, genre, fanScore, expertScore], i) => ({
  id: `demo-release-${i + 1}`, artistId: `demo-artist-${i + 1}`, artist, title,
  genres: [genre], chartType: 'overall', rank: i + 1, fanScore, expertScore,
  releaseDate: '2026-08-21', releaseType: 'single', source: 'demo',
  weeksInChart: i === 8 ? 1 : 2 + i % 7,
}));

export function getDemoRelease(id: string): Track | undefined { return demoCatalog.find(t => t.id === id); }
export function getDemoArtist(id: string) {
  const tracks = demoCatalog.filter(t => t.artistId === id);
  return tracks.length ? { id, name: tracks[0].artist, genres: tracks[0].genres, releases: tracks } : undefined;
}

export function getDemoCharts(): ChartData {
  const pool = (type: 'fan' | 'expert') => demoCatalog.map(t => ({ ...t, chartType: type, score: type === 'fan' ? t.fanScore : t.expertScore }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((t, i) => ({ ...t, rank: i + 1 }));
  const fanCharts = pool('fan');
  const expertCharts = pool('expert');
  const combinedCharts = buildPersonalChart(fanCharts, expertCharts, 55).map((t, i) => ({ ...t, movement: i === 8 ? undefined : [2, -1, 0, 3, -2][i % 5], trend_direction: i === 8 ? 'new' as const : undefined }));
  return { fanCharts, expertCharts, combinedCharts, streamingCharts: [], edition: DEMO_EDITION };
}
