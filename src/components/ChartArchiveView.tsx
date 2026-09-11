'use client';

import { useState, useEffect, useCallback } from 'react';
import { Track, Genre, ChartType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChartEntry } from '@/components/ChartEntry';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaretLeft, CaretRight, MusicNote } from '@phosphor-icons/react';

// ---------------------------------------------------------------------------
// Pure date helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Convert an ISO year + week number to the Monday (UTC) that starts that week.
 * ISO week 1 is always the week containing January 4th.
 */
export function isoWeekToMondayClient(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay();
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((dayOfWeek + 6) % 7) + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** Returns the Monday of the current ISO week (UTC midnight). */
export function getCurrentWeekMondayClient(): Date {
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** Returns the ISO year and week number of the last *completed* week. */
export function getLastCompletedWeek(): { year: number; week: number } {
  const currentMonday = getCurrentWeekMondayClient();
  const prevMonday = new Date(currentMonday);
  prevMonday.setUTCDate(currentMonday.getUTCDate() - 7);
  return dateToIsoYearWeek(prevMonday);
}

/** Derive ISO year + week from a Date that lands on a Monday. */
function dateToIsoYearWeek(date: Date): { year: number; week: number } {
  // ISO week year: the Thursday of any given week determines the year
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();

  // Jan 4 of that ISO year is always in week 1
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));

  const diffMs = date.getTime() - mondayOfWeek1.getTime();
  const week = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  return { year: isoYear, week };
}

/** Get the preceding or following ISO week, handling year boundaries. */
export function getAdjacentWeek(
  year: number,
  week: number,
  direction: 'prev' | 'next'
): { year: number; week: number } {
  if (direction === 'next') {
    const candidateWeek = week + 1;
    const candidateDate = isoWeekToMondayClient(year, candidateWeek);
    // Determine the year of the Thursday of the candidate week
    const thursdayDate = new Date(candidateDate);
    thursdayDate.setUTCDate(candidateDate.getUTCDate() + 3);

    if (thursdayDate.getUTCFullYear() !== year) {
      return { year: year + 1, week: 1 };
    }
    return { year, week: candidateWeek };
  } else {
    if (week === 1) {
      const prevYear = year - 1;
      // Does prev year have a week 53?
      const w53Start = isoWeekToMondayClient(prevYear, 53);
      const hasWeek53 = w53Start.getUTCFullYear() === prevYear;
      return { year: prevYear, week: hasWeek53 ? 53 : 52 };
    }
    return { year, week: week - 1 };
  }
}

/** True if the given ISO year/week is the current running week or in the future. */
export function isCurrentOrFutureWeek(year: number, week: number): boolean {
  const monday = isoWeekToMondayClient(year, week);
  const currentMonday = getCurrentWeekMondayClient();
  return monday >= currentMonday;
}

// ---------------------------------------------------------------------------
// Types for the API response
// ---------------------------------------------------------------------------

interface ArchiveArtist {
  id: string;
  name: string;
  spotifyId: string | null;
  genres: string[];
  bio: string | null;
  profileLink: string | null;
  imageUrl: string | null;
}

interface ArchiveRelease {
  id: string;
  title: string;
  releaseType: string;
  releaseDate: string;
  spotifyId: string | null;
  odesliLinks: unknown;
  itunesArtworkUrl: string | null;
  vercelBlobUrl: string | null;
  r2ArtworkUrl: string | null;
  artworkUrl: string | null;
  artist: ArchiveArtist;
}

interface ArchiveEntry {
  id: string;
  placement: number;
  score: number;
  communityPower: number;
  movement: number;
  chartType: string;
  weekStart: string;
  createdAt: string;
  release: ArchiveRelease | null;
}

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

function transformEntry(entry: ArchiveEntry): Track {
  return {
    id: entry.id,
    rank: entry.placement,
    artist: entry.release?.artist.name ?? '',
    title: entry.release?.title ?? '',
    genres: (entry.release?.artist.genres ?? []) as Genre[],
    movement: entry.movement,
    albumArt:
      entry.release?.r2ArtworkUrl ??
      entry.release?.vercelBlobUrl ??
      entry.release?.artworkUrl ??
      entry.release?.itunesArtworkUrl ??
      undefined,
    spotifyUri: entry.release?.spotifyId
      ? `spotify:track:${entry.release.spotifyId}`
      : undefined,
    community_power: entry.communityPower,
    chartType: 'overall' as ChartType,
  };
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function readUrlParams(): { year: number; week: number } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const yearStr = params.get('year');
    const weekStr = params.get('week');
    if (yearStr && weekStr) {
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      if (!isNaN(year) && !isNaN(week)) return { year, week };
    }
  } catch {
    // ignore
  }
  return null;
}

function pushUrl(year: number, week: number) {
  const path = window.location.pathname || '/charts/archive';
  window.history.pushState({}, '', `${path}?year=${year}&week=${week}`);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChartArchiveView() {
  const { t } = useLanguage();
  const initial = readUrlParams() ?? getLastCompletedWeek();

  const [year, setYear] = useState(initial.year);
  const [week, setWeek] = useState(initial.week);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { year: nextYear, week: nextWeek } = getAdjacentWeek(year, week, 'next');
  const isNextDisabled = isCurrentOrFutureWeek(nextYear, nextWeek);

  const fetchArchive = useCallback(async (y: number, w: number) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/charts/history?year=${y}&week=${w}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { entries: ArchiveEntry[] };
      setTracks((data.entries ?? []).map(transformEntry));
    } catch {
      setHasError(true);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive(year, week);
  }, [year, week, fetchArchive]);

  const navigate = (newYear: number, newWeek: number) => {
    setYear(newYear);
    setWeek(newWeek);
    pushUrl(newYear, newWeek);
  };

  const handlePrev = () => {
    const { year: py, week: pw } = getAdjacentWeek(year, week, 'prev');
    navigate(py, pw);
  };

  const handleNext = () => {
    if (!isNextDisabled) navigate(nextYear, nextWeek);
  };

  // Build year range for dropdown: 2020 → current year
  const currentYear = new Date().getUTCFullYear();
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

  // Build valid week numbers for selected year (drop week 53 if year doesn't have one)
  const weeksInYear = Array.from({ length: 53 }, (_, i) => i + 1).filter((w) => {
    if (w === 53) {
      const d = isoWeekToMondayClient(year, 53);
      return d.getUTCFullYear() === year;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="display-font text-3xl md:text-4xl text-foreground uppercase tracking-tight mb-2">
          {t('archive.title')}
        </h1>
        <p className="font-ui text-sm text-muted-foreground">
          {t('archive.subtitle')}
        </p>
      </div>

      {/* Navigation bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          aria-label={t('archive.prevAria')}
          className="font-ui text-xs uppercase tracking-wider"
        >
          <CaretLeft className="mr-1" />
          {t('archive.prev')}
        </Button>

        <Select
          value={year.toString()}
          onValueChange={(v) => navigate(parseInt(v, 10), 1)}
        >
          <SelectTrigger
            className="w-[100px] bg-secondary border-border font-ui text-xs"
            aria-label={t('archive.selectYear')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()} className="font-ui text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={week.toString()}
          onValueChange={(v) => navigate(year, parseInt(v, 10))}
        >
          <SelectTrigger
            className="w-[120px] bg-secondary border-border font-ui text-xs"
            aria-label={t('archive.selectWeek')}
          >
            <SelectValue placeholder={t('archive.weekN', { week })} />
          </SelectTrigger>
          <SelectContent>
            {weeksInYear.map((w) => (
              <SelectItem key={w} value={w.toString()} className="font-ui text-xs">
                {t('archive.weekN', { week: w })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={isNextDisabled}
          aria-label={t('archive.nextAria')}
          aria-disabled={isNextDisabled}
          className="font-ui text-xs uppercase tracking-wider"
        >
          {t('archive.next')}
          <CaretRight className="ml-1" />
        </Button>
      </div>

      {/* Chart card */}
      <Card className="bg-card border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="display-font text-xl uppercase text-foreground tracking-tight">
            {t('archive.weekHeading', { week, year })}
          </h2>
        </div>

        {isLoading ? (
          <div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} data-testid="archive-loading">
                <ChartEntrySkeleton index={i} />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="p-12 text-center">
            <p className="font-ui text-sm text-destructive">
              {t('archive.loadError')}
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <MusicNote size={48} className="text-muted-foreground" />
            <p className="font-ui text-sm text-muted-foreground">
              {t('archive.empty')}
            </p>
          </div>
        ) : (
          <ul>
            {tracks.map((track, index) => (
              <ChartEntry key={track.id} track={track} index={index} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
