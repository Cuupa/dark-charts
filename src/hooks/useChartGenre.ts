'use client';

import { useSearchParams } from 'next/navigation';
import { genreFromQuery } from '@/lib/routes';
import type { MainGenre } from '@/types';

export function useChartGenre(): MainGenre | null {
  const searchParams = useSearchParams();
  return genreFromQuery(searchParams.get('genre'));
}
