'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isValidPillarSlug } from '@/lib/routes';
import { PillarChartList } from '../../_components/HomeChartsView';

interface PillarPageProps {
  params: Promise<{ pillar: string }>;
}

export default function PillarChartPage({ params }: PillarPageProps) {
  const { pillar } = use(params);

  if (!isValidPillarSlug(pillar)) {
    notFound();
  }

  return (
    <ErrorBoundary level="component">
      <PillarChartList pillar={pillar} />
    </ErrorBoundary>
  );
}
