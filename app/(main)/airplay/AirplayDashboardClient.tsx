'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client-fetch';
import {
  AirplayDashboardView,
  type AirplayDashboardArtist,
} from '@/components/airplay/AirplayDashboardView';

export function AirplayDashboardClient() {
  const [disclaimer, setDisclaimer] = useState(
    'Publicly reachable scene radios we monitor — not a complete census of all internet radio.'
  );
  const [artists, setArtists] = useState<AirplayDashboardArtist[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await authFetch('/api/airplay/dashboard');
      if (res.status === 401) {
        setError('Sign in as a band or label to see detections.');
        return;
      }
      if (res.status === 403) {
        setError('Airplay detections are available for band and label accounts.');
        return;
      }
      if (!res.ok) {
        setError('Could not load airplay detections.');
        return;
      }
      const data = (await res.json()) as {
        disclaimer?: string;
        artists?: AirplayDashboardArtist[];
      };
      if (data.disclaimer) setDisclaimer(data.disclaimer);
      setArtists(data.artists ?? []);
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-3xl font-semibold">Airplay</h1>
      <AirplayDashboardView disclaimer={disclaimer} artists={artists} />
    </section>
  );
}
