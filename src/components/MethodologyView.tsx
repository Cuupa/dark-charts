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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl uppercase text-foreground">{t('methodology.title')}</h1>
        <p className="text-muted-foreground text-sm md:text-base font-ui leading-relaxed">
          {t('methodology.lead')}
        </p>
      </div>

      <Card className="p-6 bg-primary/10 border-primary/30">
        <p className="text-lg font-semibold text-foreground">
          {t('methodology.formula', { fan: pct.fan, expert: pct.expert })}
        </p>
        <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
          {t('methodology.noPay')}
        </p>
      </Card>

      <Card className="p-6 bg-card border-border space-y-8 text-sm md:text-base text-muted-foreground leading-relaxed">
        <section className="space-y-4">
          <div>
            <h2 className="text-foreground font-semibold mb-1">{t('pillar.fan')}</h2>
            <p>{t('methodology.fan')}</p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold mb-1">{t('pillar.club')}</h2>
            <p>{t('methodology.club')}</p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold mb-1">{t('pillar.overall')}</h2>
            <p>{t('methodology.overall')}</p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold mb-1">{t('djs.title')}</h2>
            <p>
              {t('methodology.djs')}{' '}
              <Link href={ROUTES.djs} className="underline text-primary">
                {t('djs.viewRanking')}
              </Link>
            </p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold mb-1">{t('pillar.streaming')}</h2>
            <p>{t('methodology.streaming')}</p>
          </div>
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
