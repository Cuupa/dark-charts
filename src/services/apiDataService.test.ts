import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiDataService } from './apiDataService';

vi.mock('@/lib/supabase/isConfigured', () => ({
  isSupabaseEnvConfigured: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { isSupabaseEnvConfigured } from '@/lib/supabase/isConfigured';

const mockedConfigured = vi.mocked(isSupabaseEnvConfigured);

function emptyChartResponse() {
  return {
    ok: true,
    json: async () => ({ success: true, entries: [] }),
  };
}

describe('ApiDataService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockedConfigured.mockReturnValue(true);
    globalThis.fetch = vi.fn().mockResolvedValue(emptyChartResponse()) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns empty charts instead of mock data when the live API is empty', async () => {
    const service = new ApiDataService();
    const data = await service.getAllCharts();

    expect(data.fanCharts).toEqual([]);
    expect(data.expertCharts).toEqual([]);
    expect(data.combinedCharts).toEqual([]);
    expect(service.isUsingMockData).toBe(false);
  });

  it('returns empty lists from getChartByType when the live API is empty', async () => {
    const service = new ApiDataService();
    await expect(service.getChartByType('fan')).resolves.toEqual([]);
  });

  it('does not synthesize an overall chart from mock data', async () => {
    const service = new ApiDataService();
    await service.getAllCharts();
    expect(service.calculateOverallChart()).toEqual([]);
  });
});
