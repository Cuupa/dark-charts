import { useEffect, useState } from 'react';
import type { Track } from '@/types';
import { mapReleaseToTrack } from '@/lib/mapReleaseToTrack';
import { logger } from '@/lib/logger';

const VOTING_POOL_LIMIT = 100;

export function useVotingReleases() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/releases?limit=${VOTING_POOL_LIMIT}&eligible=1`);
        if (!res.ok) throw new Error('Failed to load releases');
        const data = await res.json();
        if (cancelled) return;

        const mapped = (data.releases ?? []).map(mapReleaseToTrack);
        setTracks(mapped);
      } catch (err) {
        logger.error('Failed to load voting pool', { error: err });
        if (!cancelled) {
          setError('Releases konnten nicht geladen werden');
          setTracks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tracks, isLoading, error };
}