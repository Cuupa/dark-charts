'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatHybridWeightsPercent } from '@/lib/math/normalization';
import { DEFAULT_CHART_WEIGHTS } from '@/lib/api/systemSettings';
import type { ChartWeights } from '@/types';
import { ROUTES } from '@/lib/routes';

export function MethodologyView() {
  const { t } = useLanguage();
  const [weights, setWeights] = useState<ChartWeights>(DEFAULT_CHART_WEIGHTS);

  useEffect(() => {
    fetch('/api/charts/weights')
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const pct = formatHybridWeightsPercent(weights);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">{t('methodology.title')}</h1>
        <p className="text-muted-foreground text-sm font-ui">{t('methodology.lead')}</p>
      </div>

      <Card className="p-6 bg-primary/10 border-primary/30">
        <p className="text-lg font-semibold text-foreground">
          {t('methodology.formula', { fan: pct.fan, expert: pct.expert })}
        </p>
        <p className="text-sm text-muted-foreground mt-2">{t('methodology.noPay')}</p>
      </Card>

      <Card className="p-6 bg-card border-border space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-foreground">{t('pillar.fan')}</strong> — {t('methodology.fan')}
            </li>
            <li>
              <strong className="text-foreground">{t('pillar.club')}</strong> — {t('methodology.club')}
            </li>
            <li>
              <strong className="text-foreground">{t('pillar.overall')}</strong> — {t('methodology.overall')}
            </li>
            <li>
              <strong className="text-foreground">{t('djs.title')}</strong> — {t('methodology.djs')}{' '}
              <Link href={ROUTES.djs} className="underline">
                {t('djs.viewRanking')}
              </Link>
            </li>
            <li>
              <strong className="text-foreground">{t('pillar.streaming')}</strong> — {t('methodology.streaming')}
            </li>
          </ul>
        </section>

        <Separator />
        <p>{t('methodology.trust')}</p>
        <Separator />
        <p>{t('methodology.genres')}</p>
        <Separator />
        <p>
          {t('methodology.ads')}{' '}
          <Link href={ROUTES.spotlight} className="text-accent underline">
            {t('footer.spotlight')}
          </Link>
        </p>
        <Separator />
        <p>{t('methodology.integrity')}</p>
      </Card>
    </div>
  );
}
