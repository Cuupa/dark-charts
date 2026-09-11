'use client';

import { Info, Warning } from '@phosphor-icons/react';
import { useDataService } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiDataService } from '@/services/apiDataService';

export function DataSourceBanner() {
  const dataService = useDataService();
  const { t } = useLanguage();

  if (!(dataService instanceof ApiDataService)) return null;

  if (dataService.isUsingItunesData) {
    return (
      <div
        role="status"
        className="mb-6 flex items-start gap-3 rounded border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary-foreground"
      >
        <Info size={20} weight="fill" className="shrink-0 mt-0.5 text-primary" aria-hidden />
        <div>
          <p className="font-ui font-semibold uppercase tracking-wider text-xs text-primary">
            {t('demo.itunesTitle')}
          </p>
          <p className="font-ui text-xs text-muted-foreground mt-1 leading-relaxed">
            {t('demo.itunesBody')}
          </p>
        </div>
      </div>
    );
  }

  if (!dataService.isUsingMockData) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
    >
      <Warning size={20} weight="fill" className="shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-ui font-semibold uppercase tracking-wider text-xs text-amber-300">
          {t('demo.mockTitle')}
        </p>
        <p className="font-ui text-xs text-amber-100/90 mt-1 leading-relaxed">
          {t('demo.mockBody')}
        </p>
      </div>
    </div>
  );
}
