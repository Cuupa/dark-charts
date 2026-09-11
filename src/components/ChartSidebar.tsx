'use client';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
export function ChartSidebar({ hasVoted = false }: { hasVoted?: boolean }) {
  const { t } = useLanguage(); const { user } = useAuth();
  return <aside className="chart-next"><div><h2>{t('ui.voteLead')}</h2><p>{user && hasVoted ? t('sidebar.votedThisWeek') : t('ui.voteBody')}</p></div><Link className="vote-header-link" href="/voting">{t('nav.voting')}<ArrowUpRight size={18} /></Link><Link className="method-link" href="/djs">{t('djs.title')}</Link></aside>;
}
