'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CatalogSearchView } from '@/components/CatalogSearchView';

export default function SearchPage() {
  return (
    <ErrorBoundary level="component">
      <CatalogSearchView />
    </ErrorBoundary>
  );
}
