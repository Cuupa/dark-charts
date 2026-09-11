import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getPublicArtist } from '@/lib/api/public-catalog';
import { artistPath, releasePath } from '@/lib/routes';
import { getTranslator } from '@/i18n/server';

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

async function loadArtist(id: string) {
  const supabase = tryCreateServiceRoleSupabaseClient();
  if (!supabase) return null;
  return getPublicArtist(supabase, id);
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslator();
  const artist = await loadArtist(id);
  if (!artist) return { title: t('catalog.artist') };
  return {
    title: artist.name,
    description: artist.bio ?? t('catalog.onDarkCharts', { name: artist.name }),
    alternates: { canonical: artistPath(artist.id) },
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const t = await getTranslator();
  const artist = await loadArtist(id);
  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-3">
        <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t('catalog.artist')}
        </p>
        <h1 className="display-font text-4xl font-semibold uppercase tracking-tight text-foreground">
          {artist.name}
        </h1>
        {artist.verified ? (
          <p className="font-ui text-xs uppercase tracking-[0.15em] text-accent">{t('catalog.verified')}</p>
        ) : null}
        {artist.bio ? <p className="max-w-2xl text-sm text-muted-foreground">{artist.bio}</p> : null}
        {artist.genres.length > 0 ? (
          <p className="font-ui text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {artist.genres.join(' · ')}
          </p>
        ) : null}
      </header>

      <section className="space-y-4" aria-labelledby="discography-heading">
        <h2 id="discography-heading" className="display-font text-2xl font-semibold uppercase tracking-tight">
          {t('catalog.discography')}
        </h2>
        {artist.releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('catalog.noReleases')}</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {artist.releases.map((release) => (
              <li key={release.id}>
                <Link
                  href={releasePath(release.id)}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="data-font font-semibold text-foreground">{release.title}</span>
                  <span className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                    {release.releaseDate}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
