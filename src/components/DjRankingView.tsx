'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import type { PublicExpert } from '@/lib/api/dj-ranking';

export function DjRankingView() {
  const { t } = useLanguage();
  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/djs/ranking')
      .then((res) => res.json())
      .then((data: { experts?: PublicExpert[] }) => {
        if (!cancelled) setExperts(data.experts ?? []);
      })
      .catch((error: unknown) => {
        logger.error('Failed to load club ranking', { error });
        if (!cancelled) setExperts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="display-font text-4xl font-semibold uppercase tracking-tight text-foreground">
          {t('djs.title')}
        </h1>
        <p className="font-ui text-sm text-muted-foreground">{t('djs.description')}</p>
      </header>

      <Card className="border border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">…</p>
        ) : experts.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t('djs.empty')}</p>
        ) : (
          <ol className="divide-y divide-border">
            {experts.map((expert, index) => (
              <li key={expert.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="display-font w-8 text-lg font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Link
                    href={`/djs/${expert.id}`}
                    className="data-font truncate font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {expert.displayName}
                  </Link>
                </div>
                <span className="font-ui text-xs uppercase tracking-wider text-accent">
                  {expert.reputationScore.toFixed(2)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
