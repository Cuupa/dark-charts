import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getPublicRelease } from '@/lib/api/public-catalog';
import { artistPath, releasePath } from '@/lib/routes';
import { getTranslator } from '@/i18n/server';

interface ReleasePageProps {
  params: Promise<{ id: string }>;
}

async function loadRelease(id: string) {
  const supabase = tryCreateServiceRoleSupabaseClient();
  if (!supabase) return null;
  return getPublicRelease(supabase, id);
}

export async function generateMetadata({ params }: ReleasePageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslator();
  const release = await loadRelease(id);
  if (!release) return { title: t('catalog.release') };
  const artistName = release.artist?.name ?? t('chart.unknownArtist');
  return {
    title: `${release.title} — ${artistName}`,
    description: t('catalog.releaseBy', { title: release.title, artist: artistName }),
    alternates: { canonical: releasePath(release.id) },
  };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const { id } = await params;
  const t = await getTranslator();
  const release = await loadRelease(id);
  if (!release) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t('catalog.release')}
      </p>
      <h1 className="display-font text-4xl font-semibold uppercase tracking-tight text-foreground">
        {release.title}
      </h1>
      {release.artist ? (
        <p className="data-font text-lg text-muted-foreground">
          <Link
            href={artistPath(release.artist.id)}
            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {release.artist.name}
          </Link>
        </p>
      ) : null}
      <p className="font-ui text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {release.releaseType} · {release.releaseDate}
      </p>
      {release.genres.length > 0 ? (
        <p className="font-ui text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {release.genres.join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
