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
      <Card className="p-5 border-border bg-card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {isDj ? t('sidebar.voteCtaDj') : t('sidebar.voteCta')}
        </h2>
        <Button asChild className="w-full min-h-[44px]">
          <Link href={ROUTES.voting}>
            <ChartBar size={18} className="mr-2" />
            {t('sidebar.voteCta')}
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground flex items-start gap-1.5 leading-relaxed">
          {hasVoted ? (
            <>
              <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
              {t('sidebar.votedThisWeek')}
            </>
          ) : (
            t('sidebar.notVotedYet')
          )}
        </p>
      </Card>

      <Card className="p-5 border-border bg-card space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {t('djs.title')}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('djs.description')}</p>
        <Button variant="outline" size="sm" asChild className="w-full min-h-[44px]">
          <Link href={ROUTES.djs}>{t('djs.viewRanking')}</Link>
        </Button>
      </Card>

      <Card className="p-5 border-border bg-card space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SpotifyLogo size={18} weight="fill" className="text-[#1DB954]" />
          Spotify
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('sidebar.spotifySync')}</p>
        <Button variant="outline" size="sm" asChild className="w-full min-h-[44px]">
          <Link href={ROUTES.profile}>{t('nav.profile')}</Link>
        </Button>
      </Card>
    </aside>
  );
}
