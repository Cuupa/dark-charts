import { Card } from '@/components/ui/card';
import { Info, Skull, User as UserIcon, ChartBar, Scales } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AboutView() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
        {t('about.title')}
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 border border-primary">
              <Info weight="bold" className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-ui text-lg uppercase tracking-[0.12em] font-bold text-foreground">
                {t('about.mission')}
              </h2>
              <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                {t('about.missionText')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/20 border border-accent">
              <Skull weight="bold" className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-ui text-lg uppercase tracking-[0.12em] font-bold text-foreground">
                {t('about.noPayToPlay')}
              </h2>
              <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                {t('about.noPayToPlayText')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="display-font text-2xl uppercase tracking-wider text-foreground font-semibold">
            {t('about.howItWorks')}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-primary flex items-center justify-center">
                  <UserIcon weight="bold" className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                  {t('about.fanCharts')}
                </h3>
              </div>
              <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                {t('about.fanChartsText')}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-primary flex items-center justify-center">
                  <ChartBar weight="bold" className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                  {t('about.clubCharts')}
                </h3>
              </div>
              <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                {t('about.clubChartsText')}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 border border-accent flex items-center justify-center">
                <Scales weight="bold" className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                {t('about.overallCharts')}
              </h3>
            </div>
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">
              {t('about.overallChartsText')}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-ui text-sm uppercase tracking-[0.15em] font-bold text-accent mb-4">
              {t('about.principles')}
            </h3>
            <ul className="space-y-2 font-ui text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{t('about.principle1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{t('about.principle2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{t('about.principle3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{t('about.principle4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{t('about.principle5')}</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}