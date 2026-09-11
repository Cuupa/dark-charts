'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Genre, MainGenre, Track, ChartWeights } from '@/types';
import { Plus, FloppyDisk, Trash, Eye, EyeSlash, X, Funnel } from '@phosphor-icons/react';
import { useKV } from '@/hooks/useKV';
import { ChartEntry } from '@/components/ChartEntry';
import { WeightingPanel } from '@/components/WeightingPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomChart {
  id: string;
  name: string;
  genres: Genre[];
  weights: ChartWeights;
  isPublic: boolean;
  createdAt: number;
}

interface GenreGroup {
  mainGenre: MainGenre;
  subgenres: Genre[];
}

const genreGroups: GenreGroup[] = [
  {
    mainGenre: 'Gothic',
    subgenres: [
      'Gothic Rock', 'Dark Wave', 'Post Punk', 'Deathrock', 'Cold Wave',
      'Ethereal Wave', 'Neoklassik', 'Neue Deutsche Todeskunst', 'Batcave',
      'Neofolk', 'Pagan Folk', 'Nordic Folk', 'Ritual Ambient'
    ]
  },
  {
    mainGenre: 'Metal',
    subgenres: [
      'Gothic Metal', 'Dark Metal', 'Symphonic Metal', 'Doom Metal',
      'Symphonic Black Metal', 'Atmospheric Black Metal', 'Death Doom', 'Pagan Metal'
    ]
  },
  {
    mainGenre: 'Dark Electro',
    subgenres: [
      'Electronic Body Music', 'Dark Electro', 'Electro Industrial', 'Aggrotech',
      'Future Pop', 'Industrial', 'Rhythmic Noise', 'Dark Synthpop', 'Harsh EBM'
    ]
  },
  {
    mainGenre: 'Crossover',
    subgenres: [
      'Industrial Metal', 'Neue Deutsche Härte', 'Mittelalter Rock', 'Darksynth',
      'Cybergoth', 'Death Industrial', 'Folk Metal', 'Dark Techno',
      'Industrial Techno', 'Darkstep', 'Crossbreed', 'Techstep', 'Neurofunk'
    ]
  }
];

type OfficialChartEntry = {
  id?: string;
  placement?: number;
  movement?: number;
  communityPower?: number;
  release?: {
    id?: string;
    title?: string;
    itunesArtworkUrl?: string | null;
    spotifyId?: string | null;
    artist?: {
      name?: string;
      imageUrl?: string | null;
      genres?: string[];
    };
  };
};

function officialEntriesFrom(data: unknown): OfficialChartEntry[] {
  if (!data || typeof data !== 'object') return [];
  const rec = data as Record<string, unknown>;
  if (rec.success !== true || !Array.isArray(rec.entries)) return [];
  return rec.entries.filter((entry): entry is OfficialChartEntry => typeof entry === 'object' && entry !== null);
}

export function CustomChartsView() {
  const { t } = useLanguage();
  const [savedCharts, setSavedCharts] = useKV<CustomChart[]>('custom-charts', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingChart, setEditingChart] = useState<CustomChart | null>(null);
  const [viewingChart, setViewingChart] = useState<CustomChart | null>(null);
  
  const [chartName, setChartName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [weights, setWeights] = useState<ChartWeights>({ fan: 55, expert: 45, streaming: 0 });
  const [isPublic, setIsPublic] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<MainGenre[]>(['Gothic']);

  const toggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres(current => {
      if (current.includes(genre)) {
        return current.filter(g => g !== genre);
      }
      return [...current, genre];
    });
  }, []);

  const toggleGroup = useCallback((mainGenre: MainGenre) => {
    setExpandedGroups(current => {
      if (current.includes(mainGenre)) {
        return current.filter(g => g !== mainGenre);
      }
      return [...current, mainGenre];
    });
  }, []);

  const saveChart = useCallback(() => {
    if (!chartName.trim() || selectedGenres.length === 0) {
      return;
    }

    const newChart: CustomChart = {
      id: editingChart?.id || `chart-${Date.now()}`,
      name: chartName.trim(),
      genres: selectedGenres,
      weights,
      isPublic,
      createdAt: editingChart?.createdAt || Date.now()
    };

    setSavedCharts(current => {
      const charts = current || [];
      if (editingChart) {
        return charts.map(c => c.id === editingChart.id ? newChart : c);
      }
      return [...charts, newChart];
    });

    setIsCreating(false);
    setEditingChart(null);
    setChartName('');
    setSelectedGenres([]);
    setWeights({ fan: 55, expert: 45, streaming: 0 });
    setIsPublic(false);
  }, [chartName, selectedGenres, weights, isPublic, editingChart, setSavedCharts]);

  const deleteChart = useCallback((chartId: string) => {
    setSavedCharts(current => (current || []).filter(c => c.id !== chartId));
    if (viewingChart?.id === chartId) {
      setViewingChart(null);
    }
  }, [setSavedCharts, viewingChart]);

  const startEdit = useCallback((chart: CustomChart) => {
    setEditingChart(chart);
    setChartName(chart.name);
    setSelectedGenres(chart.genres);
    setWeights(chart.weights);
    setIsPublic(chart.isPublic);
    setIsCreating(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsCreating(false);
    setEditingChart(null);
    setChartName('');
    setSelectedGenres([]);
    setWeights({ fan: 55, expert: 45, streaming: 0 });
    setIsPublic(false);
  }, []);

  const viewChart = useCallback((chart: CustomChart) => {
    setViewingChart(chart);
  }, []);

  const [officialTracks, setOfficialTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  useEffect(() => {
    if (viewingChart) {
      setIsLoadingTracks(true);
      fetch('/api/charts/current')
        .then(res => res.json())
        .then((data: unknown) => {
          const mappedTracks: Track[] = officialEntriesFrom(data).map((entry) => ({
            id: entry.release?.id || entry.id || '',
            title: entry.release?.title || '',
            artist: entry.release?.artist?.name || '',
            albumArt: entry.release?.itunesArtworkUrl || entry.release?.artist?.imageUrl || '',
            spotifyUri: entry.release?.spotifyId ? `spotify:track:${entry.release.spotifyId}` : '',
            genres: (entry.release?.artist?.genres ?? []) as Genre[],
            rank: entry.placement ?? 0,
            chartType: 'overall',
            movement: entry.movement,
            trend_direction: (entry.movement ?? 0) > 0 ? 'up' : (entry.movement ?? 0) < 0 ? 'down' : 'stable',
            community_power: entry.communityPower,
            weeksInChart: 1,
            votes: 0
          }));
          setOfficialTracks(mappedTracks);
        })
        .catch(err => logger.error('Error fetching official charts', { error: err }))
        .finally(() => setIsLoadingTracks(false));
    } else {
      setOfficialTracks([]);
    }
  }, [viewingChart]);

  const filteredChart = useMemo(() => {
    if (!viewingChart) return [];
    
    return officialTracks.filter(track =>
      track.genres.some(genre => viewingChart.genres.includes(genre))
    );
  }, [viewingChart, officialTracks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          {t('custom.title')}
        </h1>
        {!isCreating && !viewingChart && (
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold"
          >
            <Plus weight="bold" className="w-4 h-4" />
            {t('custom.createChart')}
          </Button>
        )}
      </div>

      {viewingChart && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          <Card className="bg-card border border-accent p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="display-font text-2xl uppercase tracking-tight text-foreground font-semibold mb-2">
                  {viewingChart.name}
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  {viewingChart.isPublic ? (
                    <Badge className="bg-primary text-primary-foreground font-ui text-[10px] uppercase">
                      <Eye weight="bold" className="w-3 h-3 mr-1" />
                      {t('custom.public')}
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary text-secondary-foreground font-ui text-[10px] uppercase">
                      <EyeSlash weight="bold" className="w-3 h-3 mr-1" />
                      {t('custom.private')}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {viewingChart.genres.map(genre => (
                    <Badge key={genre} variant="outline" className="font-ui text-[10px] uppercase">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => setViewingChart(null)}
                variant="ghost"
                className="snap-transition"
                aria-label={t('ui.close')}
              >
                <X weight="bold" className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  {t('custom.fanWeightLabel')}
                </p>
                <p className="data-font text-2xl text-primary font-bold">
                  {viewingChart.weights.fan}%
                </p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  {t('custom.clubWeightLabel')}
                </p>
                <p className="data-font text-2xl text-accent font-bold">
                  {viewingChart.weights.expert}%
                </p>
              </div>
            </div>
          </Card>

          {filteredChart.length > 0 ? (
            <Card className="bg-card border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
                  {t('custom.chartResults', { count: isLoadingTracks ? '…' : filteredChart.length })}
                </h3>
              </div>
              <motion.div layout>
                <AnimatePresence mode="popLayout">
                  {filteredChart.slice(0, 20).map((track, index) => (
                    <motion.div
                      key={track.id}
                      layoutId={`track-${track.id}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.15 }
                      }}
                    >
                      <ChartEntry track={{ ...track, rank: index + 1 }} index={index} animate={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </Card>
          ) : (
            <Card className="bg-card border border-border p-12 text-center">
              <Funnel weight="duotone" className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-40" />
              <h3 className="display-font text-3xl uppercase text-muted-foreground mb-3 tracking-tight font-semibold">
                {t('custom.noMatchingTracks')}
              </h3>
              <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs">
                {t('custom.adjustFilters')}
              </p>
            </Card>
          )}
        </motion.div>
      )}

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="bg-card border border-accent p-6">
            <h2 className="display-font text-2xl uppercase tracking-tight text-foreground font-semibold mb-6">
              {editingChart ? t('custom.editChart') : t('custom.createNewChart')}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-2 block">
                  {t('custom.chartName')}
                </label>
                <Input
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder={t('custom.namePlaceholder')}
                  className="bg-background border-border font-ui"
                />
              </div>

              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-3 block">
                  {t('custom.visibility')}
                </label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    variant={!isPublic ? 'default' : 'outline'}
                    className="flex items-center gap-2 snap-transition font-ui text-xs uppercase"
                  >
                    <EyeSlash weight="bold" className="w-4 h-4" />
                    {t('custom.private')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    variant={isPublic ? 'default' : 'outline'}
                    className="flex items-center gap-2 snap-transition font-ui text-xs uppercase"
                  >
                    <Eye weight="bold" className="w-4 h-4" />
                    {t('custom.public')}
                  </Button>
                </div>
              </div>

              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-3 block">
                  {t('custom.selectGenresLabel', { count: selectedGenres.length })}
                </label>
                <div className="space-y-3">
                  {genreGroups.map(group => (
                    <div key={group.mainGenre} className="border border-border bg-secondary/10">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.mainGenre)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 snap-transition"
                      >
                        <span className="font-ui text-xs uppercase tracking-[0.12em] font-bold text-foreground">
                          {group.mainGenre}
                        </span>
                        <span className="text-muted-foreground">
                          {expandedGroups.includes(group.mainGenre) ? '−' : '+'}
                        </span>
                      </button>
                      
                      {expandedGroups.includes(group.mainGenre) && (
                        <div className="p-3 flex flex-wrap gap-2 border-t border-border">
                          {group.subgenres.map(genre => (
                            <Badge
                              key={genre}
                              onClick={() => toggleGenre(genre)}
                              className={`cursor-pointer snap-transition font-ui text-[10px] uppercase ${
                                selectedGenres.includes(genre)
                                  ? 'bg-accent text-accent-foreground border-accent'
                                  : 'bg-card hover:bg-accent/20 border-border'
                              }`}
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <WeightingPanel weights={weights} onChange={setWeights} />

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={saveChart}
                  disabled={!chartName.trim() || selectedGenres.length === 0}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold"
                >
                  <FloppyDisk weight="bold" className="w-4 h-4" />
                  {editingChart ? t('custom.saveChanges') : t('custom.saveChart')}
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  className="font-ui text-xs uppercase tracking-[0.15em] font-semibold snap-transition"
                >
                  {t('custom.cancel')}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!isCreating && !viewingChart && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {(savedCharts || []).map(chart => (
              <motion.div
                key={chart.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="bg-card border border-border p-4 hover:border-accent snap-transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                      {chart.name}
                    </h3>
                    {chart.isPublic ? (
                      <Eye weight="bold" className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeSlash weight="bold" className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    {t(chart.genres.length === 1 ? 'custom.genre' : 'custom.genres', { count: chart.genres.length })}
                  </p>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button
                      onClick={() => viewChart(chart)}
                      size="sm"
                      className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-[10px] uppercase"
                    >
                      {t('custom.view')}
                    </Button>
                    <Button
                      onClick={() => startEdit(chart)}
                      size="sm"
                      variant="outline"
                      className="snap-transition font-ui text-[10px] uppercase"
                    >
                      {t('custom.edit')}
                    </Button>
                    <Button
                      onClick={() => deleteChart(chart.id)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive snap-transition"
                      aria-label={t('custom.delete')}
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isCreating && !viewingChart && (!savedCharts || savedCharts.length === 0) && (
        <Card className="bg-card border border-border p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, var(--border) 8px, var(--border) 16px)`
            }} />
          </div>
          <div className="relative">
            <Funnel weight="duotone" className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="display-font text-3xl md:text-4xl uppercase text-muted-foreground mb-3 tracking-tight font-semibold">
              {t('custom.noCharts')}
            </h3>
            <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs mb-6">
              {t('custom.createFirst')}
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold"
            >
              <Plus weight="bold" className="w-4 h-4 mr-2" />
              {t('custom.createFirstCta')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
