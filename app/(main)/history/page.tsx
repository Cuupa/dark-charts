'use client';

export const dynamic = 'force-dynamic';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartArchiveView } from '@/components/ChartArchiveView';

export default function HistoryPage() {
  return (
    <main id="main-content" className="space-y-8">
      <ErrorBoundary level="component">
        <ChartArchiveView />
      </ErrorBoundary>
    </main>
  );
}
