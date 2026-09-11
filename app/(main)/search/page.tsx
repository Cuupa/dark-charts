'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CatalogSearchView } from '@/components/CatalogSearchView';

export default function SearchPage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <ErrorBoundary level="component">
        <CatalogSearchView />
      </ErrorBoundary>
    </main>
  );
}
