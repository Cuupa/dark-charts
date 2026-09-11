'use client';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChartEdition } from '@/types';
import { getIsoWeekYear } from '@/lib/week';
export function ChartHeader({ title, lead, edition }: { title: string; lead?: string; edition?: ChartEdition }) {
  const { t, language } = useLanguage();
  const date = edition ? new Date(edition.weekStart) : null;
  const week = date && Number.isFinite(date.getTime()) ? getIsoWeekYear(date) : null;
  return <div className="chart-heading"><div>
    <div className="edition-label"><span className="edition-line" />{t('ui.edition')}{week ? ` ${String(week.weekNumber).padStart(2, '0')} / ${week.year}` : ' -'}{edition?.status === 'demo' && <span className="edition-badge">{t('ui.demo')}</span>}</div>
    <h1>{title}</h1><p>{lead ?? t('ui.chartLead')}</p>
    {date && <span className="edition-date">{date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>}
  </div><Link href="/methodology" className="method-link">{t('ui.method')}<ArrowUpRight size={16} /></Link></div>;
}
