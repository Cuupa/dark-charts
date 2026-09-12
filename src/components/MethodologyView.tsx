'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl uppercase text-foreground leading-tight">
          {t('methodology.title')}
        </h1>
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

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.fanTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.fan')}</p>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.fanDetail')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.clubTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.club')}</p>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.clubDetail')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.overallTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.overall')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.streamingTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.streaming')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.airplayTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.airplay')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.djsTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {t('methodology.djs')}{' '}
          <Link href={ROUTES.djs} className="underline text-primary">
            {t('djs.viewRanking')}
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.trustTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.trust')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.genresTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.genres')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.adsTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {t('methodology.ads')}{' '}
          <Link href={ROUTES.spotlight} className="text-primary underline">
            {t('footer.spotlight')}
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t('methodology.integrityTitle')}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{t('methodology.integrity')}</p>
      </section>
    </div>
  );
}
