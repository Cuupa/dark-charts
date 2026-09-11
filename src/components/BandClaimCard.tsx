'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { artistPath } from '@/lib/routes';
import { logger } from '@/lib/logger';

interface ArtistHit {
  id: string;
  name: string;
}

export function BandClaimCard() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ArtistHit[]>([]);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [claimedName, setClaimedName] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/band/claim')
      .then((res) => res.json())
      .then((data: { artistId?: string | null; artistName?: string | null }) => {
        if (cancelled) return;
        setClaimedId(data.artistId ?? null);
        setClaimedName(data.artistName ?? null);
      })
      .catch((error: unknown) => {
        logger.error('Failed to load claim status', { error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || claimedId) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { artists?: ArtistHit[] };
        setHits(data.artists ?? []);
      } catch (error) {
        logger.error('Claim search failed', { error });
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, claimedId]);

  const claim = async (artistId: string) => {
    setIsClaiming(true);
    try {
      const res = await authFetch('/api/band/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      });
      const data = (await res.json()) as { artistId?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? t('profile.claimAlready'));
        return;
      }
      setClaimedId(data.artistId ?? artistId);
      const hit = hits.find((item) => item.id === artistId);
      setClaimedName(hit?.name ?? null);
      toast.success(t('profile.claimSuccess'));
    } catch (error) {
      logger.error('Claim failed', { error });
      toast.error(t('profile.claimAlready'));
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="space-y-4 border border-border bg-card p-6">
      <h3 className="display-font text-xl font-semibold uppercase tracking-tight text-foreground">
        {t('profile.claimTitle')}
      </h3>
      <p className="font-ui text-sm text-muted-foreground">{t('profile.claimDescription')}</p>

      {claimedId ? (
        <p className="font-ui text-sm">
          {t('profile.claimedAs')}:{' '}
          <Link href={artistPath(claimedId)} className="underline">
            {claimedName ?? claimedId}
          </Link>
        </p>
      ) : (
        <>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('profile.claimSearch')}
            aria-label={t('profile.claimSearch')}
          />
          <ul className="divide-y divide-border">
            {hits.map((hit) => (
              <li key={hit.id} className="flex items-center justify-between gap-3 py-2">
                <span>{hit.name}</span>
                <Button
                  size="sm"
                  disabled={isClaiming}
                  onClick={() => claim(hit.id)}
                  className="font-ui text-[10px] uppercase"
                >
                  {t('profile.claimAction')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
