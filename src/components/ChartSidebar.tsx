'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartBar, SpotifyLogo, CheckCircle } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';

interface ChartSidebarProps {
  hasVoted?: boolean;
}

export function ChartSidebar({ hasVoted = false }: ChartSidebarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isDj = user?.role === 'DJ';

  return (
    <aside className="space-y-4 lg:sticky lg:top-36">
      <Card className="p-4 border-border bg-card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isDj ? t('sidebar.voteCtaDj') : t('sidebar.voteCta')}
        </h2>
        <Button asChild className="w-full">
          <Link href={ROUTES.voting}>
            <ChartBar size={18} className="mr-2" />
            {t('sidebar.voteCta')}
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          {hasVoted ? (
            <>
              <CheckCircle size={14} className="text-primary shrink-0" />
              {t('sidebar.votedThisWeek')}
            </>
          ) : (
            t('sidebar.notVotedYet')
          )}
        </p>
      </Card>

      <Card className="p-4 border-border bg-card space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('djs.title')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('djs.description')}</p>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={ROUTES.djs}>{t('djs.viewRanking')}</Link>
        </Button>
      </Card>

      <Card className="p-4 border-border bg-card space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SpotifyLogo size={18} weight="fill" className="text-[#1DB954]" />
          Spotify
        </div>
        <p className="text-xs text-muted-foreground">{t('sidebar.spotifySync')}</p>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={ROUTES.profile}>{t('nav.profile')}</Link>
        </Button>
      </Card>
    </aside>
  );
}