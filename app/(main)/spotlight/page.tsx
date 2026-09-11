'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SpotlightBookingView } from '@/components/SpotlightBookingView';

export default function SpotlightPage() {
  return (
    <ErrorBoundary level="component">
      <SpotlightBookingView />
    </ErrorBoundary>
  );
}
