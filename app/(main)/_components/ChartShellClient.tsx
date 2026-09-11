'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Track, ChartType, Genre, MainGenre } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { logger } from '@/lib/logger';
import { MusicPlayer } from '@/components/MusicPlayer';
import { TrackDetailModal } from '@/components/TrackDetailModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { safeFilter, safeFindIndex } from '@/lib/safe-utils';
import { mainGenreMap } from '@/lib/config/genres';
import { navigateToChart } from '@/lib/routes';
import { useChartData } from '@/hooks/useChartData';
import type { ChartEdition } from '@/types';
import { isDemoMode } from '@/lib/demo/mode';

export interface ChartShellContextValue {
  edition?: ChartEdition;
  error: string | null;
  reload: () => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  fanCharts: Track[];
  expertCharts: Track[];
  isLoading: boolean;
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  selectedGenres: Genre[];
  setSelectedGenres: React.Dispatch<React.SetStateAction<Genre[]>>;
  filteredFanCharts: Track[];
  filteredExpertCharts: Track[];
  overallChart: Track[];
  activePromotion: { type?: string; name?: string; imageUrl?: string } | null;
  hasVoted: boolean;
  setHasVoted: (value: boolean) => void;
  handleTrackClick: (track: Track) => Promise<void>;
  handleToggleGenre: (genre: Genre) => void;
  handleClearFilters: () => void;
  getAllChartPositions: (track: Track) => {
    chartName: string;
    position: number;
    chartType?: ChartType;
    mainGenre?: MainGenre;
    subGenre?: Genre;
  }[];
  handleNavigateToChart: (
    chartType?: ChartType,
    mainGenre?: MainGenre,
    subGenre?: Genre
  ) => void;
}

const ChartShellContext = createContext<ChartShellContextValue | null>(null);

export function useChartShell(): ChartShellContextValue {
  const ctx = useContext(ChartShellContext);
  if (!ctx) {
    throw new Error('useChartShell must be used within ChartShellClient');
  }
  return ctx;
}

interface ChartShellClientProps {
  children: ReactNode;
  visibleTracks?: Track[];
}

type ActivePillarView = 'overview' | 'fan' | 'club' | 'streaming';

function resolveActivePillar(pathname: string): ActivePillarView {
  if (pathname === '/charts/fan') return 'fan';
  if (pathname === '/charts/club' || pathname === '/charts/expert') return 'club';
  if (pathname === '/charts/streaming') return 'streaming';
  return 'overview';
}

export function ChartShellClient({ children }: ChartShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activePillar = resolveActivePillar(pathname);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activePromotion, setActivePromotion] = useState<{
    type?: string;
    name?: string;
    imageUrl?: string;
  } | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerQueue, setPlayerQueue] = useState<Track[]>([]);
  const {
    fanCharts,
    expertCharts,
    isLoading,
    edition, error, reload,
    currentTrack,
    setCurrentTrack,
    selectedGenres,
    setSelectedGenres,
    filteredFanCharts,
    filteredExpertCharts,
    overallChart,
  } = useChartData();
  const playTrack = useCallback((track: Track, queue: Track[] = []) => { setPlayerQueue(queue); setCurrentTrack(track); }, [setCurrentTrack]);

  useEffect(() => {
    if (isDemoMode()) return;
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.promotions?.length > 0) {
          const promo = data.promotions[0];
          setActivePromotion({
            type: promo.label || promo.type,
            name: promo.name,
            imageUrl: promo.imageUrl,
          });
        }
      })
      .catch((err) => logger.error('Failed to load promotions', err));
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkVoteStatus = async () => {
      try {
        const res = await authFetch('/api/vote/status');
        const data = await res.json();
        if (data.hasVoted) setHasVoted(true);
      } catch (err) {
        logger.error('Failed to check vote status', { error: err });
      }
    };
    checkVoteStatus();
  }, [user]);

  const handleTrackClick = useCallback(async (track: Track) => {
    setSelectedTrackForModal(track);
    setIsModalOpen(true);
  }, []);

  const handleToggleGenre = useCallback(
    (genre: Genre) => {
      setSelectedGenres((current) => {
        if (!Array.isArray(current)) return [genre];
        if (current.includes(genre)) return safeFilter(current, (g) => g !== genre);
        return [...current, genre];
      });
    },
    [setSelectedGenres]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
  }, [setSelectedGenres]);

  const getAllChartPositions = useCallback(
    (track: Track) => {
      if (!track) return [];
      const positions: {
        chartName: string;
        position: number;
        chartType?: ChartType;
        mainGenre?: MainGenre;
        subGenre?: Genre;
      }[] = [];

      const fanIndex = safeFindIndex(fanCharts, (t) => t?.id === track.id, -1);
      if (fanIndex !== -1 && fanIndex < 20) {
        positions.push({ chartName: t('pillar.fan'), position: fanIndex + 1, chartType: 'fan' });
      }
      const expertIndex = safeFindIndex(expertCharts, (t) => t?.id === track.id, -1);
      if (expertIndex !== -1 && expertIndex < 20) {
        positions.push({
          chartName: t('pillar.club'),
          position: expertIndex + 1,
          chartType: 'expert',
        });
      }
      const overallIndex = safeFindIndex(overallChart, (t) => t?.id === track.id, -1);
      if (overallIndex !== -1) {
        positions.push({ chartName: t('pillar.overall'), position: overallIndex + 1 });
      }

      Object.entries(mainGenreMap).forEach(([mainGenre, subGenres]) => {
        const mainGenreTracks = safeFilter(
          [...fanCharts, ...expertCharts],
          (t) => t && Array.isArray(t.genres) && t.genres.some((g) => subGenres.includes(g))
        );
        const mainGenreIndex = safeFindIndex(mainGenreTracks, (t) => t?.id === track.id, -1);
        if (mainGenreIndex !== -1 && mainGenreIndex < 20) {
          positions.push({
            chartName: `${mainGenre} Charts`,
            position: mainGenreIndex + 1,
            mainGenre: mainGenre as MainGenre,
          });
        }
        track.genres?.forEach((genre) => {
          if (subGenres.includes(genre)) {
            const subGenreTracks = safeFilter(mainGenreTracks, (t) => t?.genres?.includes(genre));
            const subGenreIndex = safeFindIndex(subGenreTracks, (t) => t?.id === track.id, -1);
            if (subGenreIndex !== -1 && subGenreIndex < 20) {
              positions.push({
                chartName: genre,
                position: subGenreIndex + 1,
                mainGenre: mainGenre as MainGenre,
                subGenre: genre,
              });
            }
          }
        });
      });

      return positions;
    },
    [fanCharts, expertCharts, overallChart, t]
  );

  const handleNavigateToChart = useCallback(
    (chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => {
      navigateToChart(router, chartType, mainGenre, subGenre);
    },
    [router]
  );

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = playerQueue;
    const currentIndex = safeFindIndex(allTracks, (t) => t?.id === currentTrack.id, -1);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, playerQueue, setCurrentTrack]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = playerQueue;
    const currentIndex = safeFindIndex(allTracks, (t) => t?.id === currentTrack.id, -1);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, playerQueue, setCurrentTrack]);

  const value = useMemo<ChartShellContextValue>(
    () => ({
      edition, error, reload, playTrack,
      fanCharts,
      expertCharts,
      isLoading,
      currentTrack,
      setCurrentTrack,
      selectedGenres,
      setSelectedGenres,
      filteredFanCharts,
      filteredExpertCharts,
      overallChart,
      activePromotion,
      hasVoted,
      setHasVoted,
      handleTrackClick,
      handleToggleGenre,
      handleClearFilters,
      getAllChartPositions,
      handleNavigateToChart,
    }),
    [
      edition, error, reload, playTrack,
      fanCharts,
      expertCharts,
      isLoading,
      currentTrack,
      setCurrentTrack,
      selectedGenres,
      setSelectedGenres,
      filteredFanCharts,
      filteredExpertCharts,
      overallChart,
      activePromotion,
      hasVoted,
      handleTrackClick,
      handleToggleGenre,
      handleClearFilters,
      getAllChartPositions,
      handleNavigateToChart,
    ]
  );

  return (
    <ChartShellContext.Provider value={value}>
      {children}
      <ErrorBoundary level="component">
        {(
          <MusicPlayer
            currentTrack={currentTrack}
            onNext={handleNext}
            onPrevious={handlePrevious}
            allTracks={playerQueue}
            onClose={() => setCurrentTrack(null)}
          />
        )}
      </ErrorBoundary>
      <ErrorBoundary level="component">
        <TrackDetailModal
          track={selectedTrackForModal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          allChartPositions={
            selectedTrackForModal ? getAllChartPositions(selectedTrackForModal) : []
          }
          onNavigateToChart={handleNavigateToChart}
        />
      </ErrorBoundary>
    </ChartShellContext.Provider>
  );
}
