'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DjRankingView } from '@/components/DjRankingView';

export default function DjRankingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <ErrorBoundary level="component">
        <DjRankingView />
      </ErrorBoundary>
    </div>
  );
}
