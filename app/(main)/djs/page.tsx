'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DjRankingView } from '@/components/DjRankingView';

export default function DjRankingPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <ErrorBoundary level="component">
        <DjRankingView />
      </ErrorBoundary>
    </main>
  );
}
