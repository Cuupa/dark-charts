'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { artistPath, releasePath } from '@/lib/routes';
import { logger } from '@/lib/logger';

interface SearchPayload {
  query: string;
  songs: Array<{ id: string; title: string; artist: { id: string; name: string } | null }>;
  artists: Array<{ id: string; name: string; verified: boolean }>;
}

export function CatalogSearchView() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as SearchPayload;
        setResults(data);
      } catch (error) {
        logger.error('Catalog search failed', { error });
        setResults({ query: trimmed, songs: [], artists: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="display-font text-4xl font-semibold uppercase tracking-tight text-foreground">
          {t('catalog.searchTitle')}
        </h1>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.searchPlaceholder')}
          className="max-w-xl"
        />
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">…</p> : null}

      {results && results.artists.length === 0 && results.songs.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">{t('catalog.noResults')}</p>
      ) : null}

      {results && results.artists.length > 0 ? (
        <section className="space-y-3" aria-labelledby="search-artists">
          <h2 id="search-artists" className="display-font text-xl font-semibold uppercase">
            {t('catalog.artists')}
          </h2>
          <ul className="divide-y divide-border border border-border">
            {results.artists.map((artist) => (
              <li key={artist.id}>
                <Link
                  href={artistPath(artist.id)}
                  className="block px-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results && results.songs.length > 0 ? (
        <section className="space-y-3" aria-labelledby="search-releases">
          <h2 id="search-releases" className="display-font text-xl font-semibold uppercase">
            {t('catalog.releases')}
          </h2>
          <ul className="divide-y divide-border border border-border">
            {results.songs.map((song) => (
              <li key={song.id}>
                <Link
                  href={releasePath(song.id)}
                  className="block px-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-semibold">{song.title}</span>
                  {song.artist ? (
                    <span className="ml-2 text-muted-foreground">{song.artist.name}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
