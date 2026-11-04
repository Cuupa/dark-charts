import { MainGenre, Genre } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';
import {
  GENRE_CHART_LIMIT,
  MIN_GENRE_FAN_VOTES,
  getAllSubGenres,
  mainGenreChartKey,
  releaseMatchesGenre,
  releaseMatchesMainGenre,
} from '@/lib/genre-charts';
import { rankQualifiedItems } from '@/lib/charts/qualify';

export interface GenreAggregationScore {
  releaseId: string;
  fanScore: number;
  expertScore: number;
  streamingScore: number;
  weightedScore: number;
  communityPower: number;
}

export interface GenreChartEntryInsert {
  releaseId: string;
  chartType: 'fan' | 'expert' | 'streaming' | 'combined';
  genre: string;
  weekStart: string;
  placement: number;
  score: number;
  fanScore: number;
  expertScore: number;
  communityPower: number;
  movement: number;
  weekNumber: number;
  year: number;
}

interface ReleaseGenreInfo {
  releaseGenres: string[];
  artistGenres: string[];
}

export function buildGenreChartInserts(params: {
  combinedScores: GenreAggregationScore[];
  releaseGenreMap: Map<string, ReleaseGenreInfo>;
  fanVoteCountByRelease: Map<string, number>;
  weekStartIso: string;
  weekNumber: number;
  year: number;
}): GenreChartEntryInsert[] {
  const {
    combinedScores,
    releaseGenreMap,
    fanVoteCountByRelease,
    weekStartIso,
    weekNumber,
    year,
  } = params;

  const inserts: GenreChartEntryInsert[] = [];
  const chartTypes: Array<'fan' | 'expert' | 'streaming' | 'combined'> = [
    'fan',
    'expert',
    'streaming',
    'combined',
  ];

  const scoreFns = {
    fan: (item: GenreAggregationScore) => item.fanScore,
    expert: (item: GenreAggregationScore) => item.expertScore,
    streaming: (item: GenreAggregationScore) => item.streamingScore,
    combined: (item: GenreAggregationScore) => item.weightedScore,
  };

  const addGenreCharts = (
    genreKey: string,
    filterFn: (releaseId: string) => boolean,
    minFanVotes: number
  ) => {
    const eligible = combinedScores.filter((item) => {
      if (!filterFn(item.releaseId)) return false;
      return (fanVoteCountByRelease.get(item.releaseId) ?? 0) >= minFanVotes;
    });

    if (eligible.length === 0) return;

    for (const chartType of chartTypes) {
      const ranked = rankQualifiedItems(eligible, scoreFns[chartType]).slice(
        0,
        GENRE_CHART_LIMIT
      );

      for (const { item, placement, score } of ranked) {
        inserts.push({
          releaseId: item.releaseId,
          chartType,
          genre: genreKey,
          weekStart: weekStartIso,
          placement,
          score,
          fanScore: item.fanScore,
          expertScore: item.expertScore,
          communityPower: chartType === 'combined' ? item.communityPower : 0,
          movement: 0,
          weekNumber,
          year,
        });
      }
    }
  };

  for (const subGenre of getAllSubGenres()) {
    addGenreCharts(
      subGenre,
      (releaseId) => {
        const info = releaseGenreMap.get(releaseId);
        if (!info) return false;
        return releaseMatchesGenre(info.releaseGenres, info.artistGenres, subGenre);
      },
      MIN_GENRE_FAN_VOTES
    );
  }

  for (const mainGenre of Object.keys(mainGenreMap) as MainGenre[]) {
    addGenreCharts(
      mainGenreChartKey(mainGenre),
      (releaseId) => {
        const info = releaseGenreMap.get(releaseId);
        if (!info) return false;
        return releaseMatchesMainGenre(info.releaseGenres, info.artistGenres, mainGenre);
      },
      MIN_GENRE_FAN_VOTES
    );
  }

  return inserts;
}