import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import {
  ChartArchiveView,
  isoWeekToMondayClient,
  getCurrentWeekMondayClient,
  getLastCompletedWeek,
  getAdjacentWeek,
  isCurrentOrFutureWeek,
} from './ChartArchiveView';

function renderArchive() {
  return render(
    <LanguageProvider>
      <ChartArchiveView />
    </LanguageProvider>
  );
}

// ---- Global mocks ----

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPushState = vi.fn();

// Wednesday 2025-04-09 → current ISO week 15 (Mon 2025-04-07)
// Last completed week = 14 (Mon 2025-03-31)
const FIXED_NOW = new Date('2025-04-09T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(FIXED_NOW);

  // Override window.location to control initial URL params
  Object.defineProperty(window, 'location', {
    value: { pathname: '/charts/archive', search: '' },
    writable: true,
    configurable: true,
  });

  // Override history.pushState
  Object.defineProperty(window, 'history', {
    value: { pushState: mockPushState },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  mockFetch.mockReset();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ---- Helper builders ----

function makeEntry(placement: number, overrides = {}) {
  return {
    id: `entry-${placement}`,
    placement,
    score: 90 - placement,
    communityPower: 60,
    movement: 1,
    chartType: 'combined',
    weekStart: '2025-03-31T00:00:00.000Z',
    createdAt: '2025-04-01T00:00:00.000Z',
    release: {
      id: `release-${placement}`,
      title: `Track ${placement}`,
      releaseType: 'single',
      releaseDate: '2025-01-01T00:00:00.000Z',
      spotifyId: null,
      odesliLinks: null,
      itunesArtworkUrl: null,
      vercelBlobUrl: null,
      artist: {
        id: `artist-${placement}`,
        name: `Artist ${placement}`,
        spotifyId: null,
        genres: ['Gothic Rock'],
        bio: null,
        profileLink: null,
        imageUrl: null,
      },
    },
    ...overrides,
  };
}

function mockSuccessResponse(entries = [makeEntry(1), makeEntry(2)]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      year: 2025,
      week: 14,
      weekStart: '2025-03-31T00:00:00.000Z',
      entries,
      count: entries.length,
    }),
  });
}

function mockPendingFetch() {
  mockFetch.mockReturnValue(new Promise(() => {}));
}

// ---- Pure helper unit tests ----

describe('isoWeekToMondayClient', () => {
  it('week 14 of 2025 starts on 2025-03-31', () => {
    const d = isoWeekToMondayClient(2025, 14);
    expect(d.toISOString().startsWith('2025-03-31')).toBe(true);
  });

  it('week 15 of 2025 starts on 2025-04-07', () => {
    const d = isoWeekToMondayClient(2025, 15);
    expect(d.toISOString().startsWith('2025-04-07')).toBe(true);
  });
});

describe('getCurrentWeekMondayClient', () => {
  it('returns Monday 2025-04-07 when system time is Wednesday 2025-04-09', () => {
    const d = getCurrentWeekMondayClient();
    expect(d.toISOString().startsWith('2025-04-07')).toBe(true);
  });
});

describe('getLastCompletedWeek', () => {
  it('returns week 14 of 2025 when current week is 15', () => {
    const { year, week } = getLastCompletedWeek();
    expect(year).toBe(2025);
    expect(week).toBe(14);
  });
});

describe('getAdjacentWeek', () => {
  it('next from week 14 → week 15 of same year', () => {
    expect(getAdjacentWeek(2025, 14, 'next')).toEqual({ year: 2025, week: 15 });
  });

  it('prev from week 14 → week 13 of same year', () => {
    expect(getAdjacentWeek(2025, 14, 'prev')).toEqual({ year: 2025, week: 13 });
  });

  it('prev from week 1 → last week of prior year', () => {
    const result = getAdjacentWeek(2025, 1, 'prev');
    expect(result.year).toBe(2024);
    expect(result.week).toBeGreaterThanOrEqual(52);
  });

  it('next crossing year boundary → week 1 of next year', () => {
    // 2025 has 52 ISO weeks; week 52 next → 2026 week 1
    const result = getAdjacentWeek(2025, 52, 'next');
    expect(result.year).toBe(2026);
    expect(result.week).toBe(1);
  });
});

describe('isCurrentOrFutureWeek', () => {
  it('returns true for current week (week 15 of 2025)', () => {
    expect(isCurrentOrFutureWeek(2025, 15)).toBe(true);
  });

  it('returns false for last completed week (week 14 of 2025)', () => {
    expect(isCurrentOrFutureWeek(2025, 14)).toBe(false);
  });

  it('returns true for a future week', () => {
    expect(isCurrentOrFutureWeek(2025, 20)).toBe(true);
  });
});

// ---- Component rendering tests ----

describe('ChartArchiveView', () => {
  describe('loading state', () => {
    it('renders 10 skeleton wrappers while fetch is pending', () => {
      mockPendingFetch();
      renderArchive();
      const skeletons = screen.getAllByTestId('archive-loading');
      expect(skeletons).toHaveLength(10);
    });
  });

  describe('loaded state', () => {
    it('renders artist names and placements after fetch resolves', async () => {
      mockSuccessResponse();
      renderArchive();
      await waitFor(() => {
        expect(screen.getByText('Artist 1')).toBeDefined();
      }, { timeout: 2000 });
      expect(screen.getByText('Artist 2')).toBeDefined();
    });

    it('renders track titles', async () => {
      mockSuccessResponse();
      renderArchive();
      await waitFor(() => {
        expect(screen.getByText('Track 1')).toBeDefined();
      }, { timeout: 2000 });
    });

    it('does NOT render any voting buttons', async () => {
      mockSuccessResponse();
      renderArchive();
      await waitFor(() => {
        expect(screen.queryByText(/Artist 1/)).toBeDefined();
      }, { timeout: 2000 });
      expect(screen.queryByRole('button', { name: /vote/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /credit/i })).toBeNull();
    });
  });

  describe('empty state', () => {
    it('shows empty state message when entries array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, year: 2025, week: 14, weekStart: '2025-03-31T00:00:00.000Z', entries: [], count: 0 }),
      });
      renderArchive();
      await waitFor(() =>
        expect(screen.getByText(/keine charts für diese woche/i)).toBeDefined()
      );
    });
  });

  describe('navigation', () => {
    it('renders Prev Week button with accessible label', async () => {
      mockSuccessResponse();
      renderArchive();
      expect(screen.getByRole('button', { name: /vorherige woche/i })).toBeDefined();
    });

    it('renders Next Week button with accessible label', async () => {
      mockSuccessResponse();
      renderArchive();
      expect(screen.getByRole('button', { name: /nächste woche/i })).toBeDefined();
    });

    it('Next Week button is disabled when viewing the last completed week (week 14)', async () => {
      // With system time in week 15, viewing week 14 → next would be week 15 (current) → disabled
      Object.defineProperty(window, 'location', {
        value: { pathname: '/charts/archive', search: '?year=2025&week=14' },
        writable: true,
        configurable: true,
      });
      mockSuccessResponse();
      renderArchive();
      await waitFor(() => screen.getByRole('button', { name: /nächste woche/i }));
      const nextBtn = screen.getByRole('button', { name: /nächste woche/i });
      expect(nextBtn).toHaveProperty('disabled', true);
    });

    it('clicking Prev Week calls window.history.pushState with updated URL', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/charts/archive', search: '?year=2025&week=14' },
        writable: true,
        configurable: true,
      });
      mockSuccessResponse();
      // Also mock the subsequent fetch after navigation
      mockSuccessResponse([makeEntry(1)]);
      renderArchive();
      await waitFor(() => screen.getByRole('button', { name: /vorherige woche/i }));

      fireEvent.click(screen.getByRole('button', { name: /vorherige woche/i }));

      expect(mockPushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('year=2025&week=13')
      );
    });
  });

  describe('URL param reading', () => {
    it('reads year and week from URLSearchParams on mount', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/charts/archive', search: '?year=2025&week=12' },
        writable: true,
        configurable: true,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, year: 2025, week: 12, weekStart: '2025-03-17T00:00:00.000Z', entries: [], count: 0 }),
      });
      renderArchive();
      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('year=2025&week=12'))
      );
    });

    it('falls back to last completed week when no params are present', async () => {
      // location.search = '' (set in beforeEach)
      mockSuccessResponse();
      renderArchive();
      await waitFor(() =>
        // Last completed = week 14 of 2025
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('year=2025&week=14'))
      );
    });
  });
});
