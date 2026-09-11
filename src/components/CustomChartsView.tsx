import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Genre, MainGenre, Track, ChartWeights } from '@/types';
import { Plus, FloppyDisk, Trash, Eye, EyeSlash, X, Funnel } from '@phosphor-icons/react';
import { useKV } from '@/hooks/useKV';
import { ChartEntry } from '@/components/ChartEntry';
import { WeightingPanel } from '@/components/WeightingPanel';
import { useDataService } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

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

export function CustomChartsView() {
  const dataService = useDataService();
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
        .then(data => {
          if (data.success && data.entries) {
            const mappedTracks: Track[] = data.entries.map((entry: any) => ({
              id: entry.release?.id || entry.id,
              title: entry.release?.title || '',
              artist: entry.release?.artist?.name || '',
              albumArt: entry.release?.itunesArtworkUrl || entry.release?.artist?.imageUrl || '',
              spotifyUri: entry.release?.spotifyId ? `spotify:track:${entry.release.spotifyId}` : '',
              genres: entry.release?.artist?.genres || [],
              rank: entry.placement,
              movement: entry.movement,
              trend_direction: entry.movement > 0 ? 'up' : entry.movement < 0 ? 'down' : 'stable',
              community_power: entry.communityPower,
              weeksInChart: 1, // Optional: might need to be computed or passed
              votes: 0 // Fan scores are abstracted
            }));
            setOfficialTracks(mappedTracks);
          }
        })
        .catch(err => console.error('Error fetching official charts:', err))
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
          Custom Charts
        </h1>
        {!isCreating && !viewingChart && (
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Create Chart
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
                      Public
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary text-secondary-foreground font-ui text-[10px] uppercase">
                      <EyeSlash weight="bold" className="w-3 h-3 mr-1" />
                      Private
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
              >
                <X weight="bold" className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Fan Weight
                </p>
                <p className="data-font text-2xl text-primary font-bold">
                  {viewingChart.weights.fan}%
                </p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Club Weight
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
                  Chart Results ({isLoadingTracks ? '...' : filteredChart.length} tracks)
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
                No Matching Tracks
              </h3>
              <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs">
                Try adjusting your genre filters
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
              {editingChart ? 'Edit Chart' : 'Create New Chart'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-2 block">
                  Chart Name
                </label>
                <Input
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="My Custom Chart"
                  className="bg-background border-border font-ui"
                />
              </div>

              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-3 block">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    variant={!isPublic ? 'default' : 'outline'}
                    className="flex items-center gap-2 snap-transition font-ui text-xs uppercase"
                  >
                    <EyeSlash weight="bold" className="w-4 h-4" />
                    Private
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    variant={isPublic ? 'default' : 'outline'}
                    className="flex items-center gap-2 snap-transition font-ui text-xs uppercase"
                  >
                    <Eye weight="bold" className="w-4 h-4" />
                    Public
                  </Button>
                </div>
              </div>

              <div>
                <label className="font-ui text-xs uppercase tracking-[0.15em] text-foreground font-semibold mb-3 block">
                  Select Genres ({selectedGenres.length} selected)
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
                  {editingChart ? 'Save Changes' : 'Save Chart'}
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  className="font-ui text-xs uppercase tracking-[0.15em] font-semibold snap-transition"
                >
                  Cancel
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
                    {chart.genres.length} {chart.genres.length === 1 ? 'Genre' : 'Genres'}
                  </p>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button
                      onClick={() => viewChart(chart)}
                      size="sm"
                      className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-[10px] uppercase"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => startEdit(chart)}
                      size="sm"
                      variant="outline"
                      className="snap-transition font-ui text-[10px] uppercase"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteChart(chart.id)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive snap-transition"
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
              No Custom Charts Yet
            </h3>
            <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs mb-6">
              Create your first custom chart by selecting genres and weights
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-accent hover:bg-accent/80 text-accent-foreground snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold"
            >
              <Plus weight="bold" className="w-4 h-4 mr-2" />
              Create Your First Chart
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
