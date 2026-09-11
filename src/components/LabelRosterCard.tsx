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

interface RosterArtist {
  id: string;
  name: string;
  verified: boolean;
}

interface SearchHit {
  id: string;
  name: string;
}

export function LabelRosterCard() {
  const { t } = useLanguage();
  const [roster, setRoster] = useState<RosterArtist[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadRoster = () => {
    authFetch('/api/label/roster')
      .then((res) => res.json())
      .then((data: { artists?: RosterArtist[] }) => setRoster(data.artists ?? []))
      .catch((error: unknown) => logger.error('Failed to load label roster', { error }));
  };

  useEffect(() => {
    loadRoster();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { artists?: SearchHit[] };
        setHits(data.artists ?? []);
      } catch (error) {
        logger.error('Label roster search failed', { error });
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const attach = async (artistId: string) => {
    setIsSaving(true);
    try {
      const res = await authFetch('/api/label/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? t('profile.labelAttachFailed'));
        return;
      }
      toast.success(t('profile.labelAttachSuccess'));
      setQuery('');
      setHits([]);
      loadRoster();
    } catch (error) {
      logger.error('Label attach failed', { error });
      toast.error(t('profile.labelAttachFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-4 border border-border bg-card p-6">
      <h3 className="display-font text-xl font-semibold uppercase tracking-tight text-foreground">
        {t('profile.labelRosterTitle')}
      </h3>
      <p className="font-ui text-sm text-muted-foreground">{t('profile.labelRosterDescription')}</p>

      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('profile.labelRosterEmpty')}</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {roster.map((artist) => (
            <li key={artist.id}>
              <Link
                href={artistPath(artist.id)}
                className="block px-4 py-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {artist.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('profile.labelSearch')}
        aria-label={t('profile.labelSearch')}
      />
      <ul className="divide-y divide-border">
        {hits.map((hit) => (
          <li key={hit.id} className="flex items-center justify-between gap-3 py-2">
            <span>{hit.name}</span>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => attach(hit.id)}
              className="font-ui text-[10px] uppercase"
            >
              {t('profile.labelAttach')}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
