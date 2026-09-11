import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getPublicExpert } from '@/lib/api/dj-ranking';
import { ROUTES } from '@/lib/routes';
import { getTranslator } from '@/i18n/server';

interface DjPageProps {
  params: Promise<{ id: string }>;
}

async function loadExpert(id: string) {
  const supabase = tryCreateServiceRoleSupabaseClient();
  if (!supabase) return null;
  return getPublicExpert(supabase, id);
}

export async function generateMetadata({ params }: DjPageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslator();
  const expert = await loadExpert(id);
  if (!expert) return { title: t('djs.role') };
  return {
    title: expert.displayName,
    description: t('catalog.onDarkCharts', { name: expert.displayName }),
    alternates: { canonical: `/djs/${expert.id}` },
  };
}

export default async function DjProfilePage({ params }: DjPageProps) {
  const { id } = await params;
  const t = await getTranslator();
  const expert = await loadExpert(id);
  if (!expert) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t('djs.role')}
      </p>
      <h1 className="display-font text-4xl font-semibold uppercase tracking-tight text-foreground">
        {expert.displayName}
      </h1>
      <p className="font-ui text-xs uppercase tracking-[0.15em] text-accent">
        {t('djs.reputation', { score: expert.reputationScore.toFixed(2) })}
      </p>
      {expert.bio ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{expert.bio}</p> : null}
      {expert.soundcloudLink ? (
        <p>
          <a
            href={expert.soundcloudLink}
            className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('catalog.soundcloud')}
          </a>
        </p>
      ) : null}
      <p>
        <Link href={ROUTES.djs} className="text-sm underline">
          {t('djs.backToRanking')}
        </Link>
      </p>
    </div>
  );
}
