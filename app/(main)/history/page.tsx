'use client';

export const dynamic = 'force-dynamic';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartArchiveView } from '@/components/ChartArchiveView';

export default function HistoryPage() {
  return (
    <ErrorBoundary level="component">
      <ChartArchiveView />
    </ErrorBoundary>
  );
}
