'use client';

import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VotingArea } from '@/components/VotingArea';
import { ROUTES } from '@/lib/routes';
import { useChartShell } from '../_components/ChartShellClient';
import { useVotingReleases } from '@/hooks/useVotingReleases';
import { VotingAreaSkeleton } from '@/components/skeletons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VotingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { handleTrackClick, setHasVoted } = useChartShell();
  const { tracks, isLoading, error } = useVotingReleases();

  if (isLoading) {
    return <VotingAreaSkeleton />;
  }

  if (error || tracks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground font-ui text-sm">
        {error ?? t('voting.noReleases')}
      </div>
    );
  }

  return (
    <ErrorBoundary level="component">
      <VotingArea
        allTracks={tracks}
        onTrackClick={handleTrackClick}
        onVoteComplete={() => {
          setHasVoted(true);
          router.push(ROUTES.votingConfirmation);
        }}
      />
    </ErrorBoundary>
  );
}