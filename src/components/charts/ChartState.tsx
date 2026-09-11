'use client';
import { ArrowClockwise, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
export function ChartState({ error = false, onRetry, message }: { error?: boolean; onRetry?: () => void; message?: string }) {
  const { t } = useLanguage();
  return <div className="chart-state" role={error ? 'alert' : 'status'}><MagnifyingGlass size={28} aria-hidden="true" /><p>{message ?? t(error ? 'chart.loadError' : 'ui.empty')}</p>{onRetry && <Button variant="outline" onClick={onRetry}><ArrowClockwise />{t('ui.retry')}</Button>}</div>;
}
