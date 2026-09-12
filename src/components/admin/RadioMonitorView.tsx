'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RadioMonitorSettings } from '@/lib/radio/constants';
import { DEFAULT_RADIO_GENRE_TAGS } from '@/lib/radio/constants';

export interface RadioStationRow {
  id: string;
  name: string;
  country: string | null;
  healthStatus: string;
  monitorEnabled: boolean;
  legalHold: boolean;
  lastError: string | null;
  lastMetadataAt: string | null;
  tags: string[];
}

export interface RadioEventRow {
  stationName?: string | null;
  rawTitle?: string | null;
  artistName?: string | null;
  releaseTitle?: string | null;
  confidence: number;
  detectionMethod?: string | null;
  observedAt: string;
}

export interface RadioMonitorStats {
  total: number;
  monitored: number;
  dead: number;
  blocked: number;
}

interface RadioMonitorViewProps {
  isLoading?: boolean;
  heartbeatStale?: boolean;
  stats?: RadioMonitorStats;
  stations?: RadioStationRow[];
  events?: RadioEventRow[];
  settings?: RadioMonitorSettings;
  unmatchedOnly?: boolean;
  discoverTags?: string;
  manualName?: string;
  manualUrl?: string;
  onToggleMonitor?: (id: string, enabled: boolean) => void;
  onToggleLegalHold?: (id: string, hold: boolean) => void;
  onUnmatchedChange?: (value: boolean) => void;
  onSaveSettings?: (settings: RadioMonitorSettings) => void;
  onDiscover?: () => void;
  onAddStation?: () => void;
  onManualNameChange?: (value: string) => void;
  onManualUrlChange?: (value: string) => void;
  onSettingsChange?: (settings: RadioMonitorSettings) => void;
  initialTab?: string;
}

export function RadioMonitorView({
  isLoading,
  heartbeatStale,
  stats,
  stations = [],
  events = [],
  settings,
  unmatchedOnly = false,
  discoverTags,
  manualName = '',
  manualUrl = '',
  onToggleMonitor,
  onToggleLegalHold,
  onUnmatchedChange,
  onSaveSettings,
  onDiscover,
  onAddStation,
  onManualNameChange,
  onManualUrlChange,
  onSettingsChange,
  initialTab = 'overview',
}: RadioMonitorViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="radio-monitor-loading">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {heartbeatStale && (
        <Card className="p-4 border-amber-800 bg-amber-950/30 text-sm">
          The radio worker heartbeat is stale. Metadata probes are not running until the Docker worker is up.
        </Card>
      )}

      <Tabs defaultValue={initialTab}>
        <TabsList aria-label="Radio monitor sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Dark Charts monitors relevant, publicly reachable dark-scene radios. Coverage is not a census of all internet radio.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Stations" value={stats?.total ?? 0} />
            <Stat label="Monitored" value={stats?.monitored ?? 0} />
            <Stat label="Dead" value={stats?.dead ?? 0} />
            <Stat label="Blocked" value={stats?.blocked ?? 0} />
          </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4 pt-4">
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onAddStation?.();
            }}
          >
            <Input
              aria-label="Station name"
              placeholder="Station name"
              value={manualName}
              onChange={(event) => onManualNameChange?.(event.target.value)}
            />
            <Input
              aria-label="Stream URL"
              placeholder="https://example.com/stream"
              value={manualUrl}
              onChange={(event) => onManualUrlChange?.(event.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
          <Card className="p-0 overflow-x-auto">
            <Table>
              <TableCaption>Public stream candidates and monitored stations</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Legal hold</TableHead>
                  <TableHead>Last error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell>
                      <div className="font-medium">{station.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {station.country ?? '—'} {station.tags.slice(0, 3).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{station.healthStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`monitor-${station.id}`}
                          checked={station.monitorEnabled}
                          onCheckedChange={(checked) => onToggleMonitor?.(station.id, checked)}
                          aria-label={`Monitor ${station.name}`}
                        />
                        <Label htmlFor={`monitor-${station.id}`} className="sr-only">
                          Monitor {station.name}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        id={`hold-${station.id}`}
                        checked={station.legalHold}
                        onCheckedChange={(checked) => onToggleLegalHold?.(station.id, checked)}
                        aria-label={`Legal hold ${station.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[16rem] truncate">
                      {station.lastError ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Search public directories. Results land as candidates; nothing is probed until you enable monitoring.
          </p>
          <p className="text-xs text-muted-foreground">
            Tags: {discoverTags ?? DEFAULT_RADIO_GENRE_TAGS.join(', ')}
          </p>
          <Button type="button" onClick={() => onDiscover?.()}>
            Discover from Radio Browser
          </Button>
        </TabsContent>

        <TabsContent value="events" className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="unmatched-only"
              checked={unmatchedOnly}
              onCheckedChange={(checked) => onUnmatchedChange?.(checked)}
              aria-label="Unmatched only"
            />
            <Label htmlFor="unmatched-only">Unmatched only</Label>
          </div>
          <Card className="p-0 overflow-x-auto">
            <Table>
              <TableCaption>Recent now-playing detections</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Raw title</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, index) => (
                  <TableRow key={`${event.observedAt}-${index}`}>
                    <TableCell className="whitespace-nowrap text-xs">{event.observedAt}</TableCell>
                    <TableCell>{event.stationName ?? '—'}</TableCell>
                    <TableCell>{event.rawTitle ?? '—'}</TableCell>
                    <TableCell>
                      {event.artistName
                        ? `${event.artistName}${event.releaseTitle ? ` — ${event.releaseTitle}` : ''}`
                        : 'unmatched'}
                    </TableCell>
                    <TableCell>{event.confidence.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 pt-4">
          {settings && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id="monitor-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => onSettingsChange?.({ ...settings, enabled: checked })}
                />
                <Label htmlFor="monitor-enabled">Master enable (also requires the feature flag)</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  id="interval"
                  label="Probe interval (seconds)"
                  value={settings.defaultProbeIntervalSeconds}
                  onChange={(value) =>
                    onSettingsChange?.({ ...settings, defaultProbeIntervalSeconds: value })
                  }
                />
                <NumberField
                  id="concurrency"
                  label="Max concurrent probes"
                  value={settings.maxConcurrentProbes}
                  onChange={(value) => onSettingsChange?.({ ...settings, maxConcurrentProbes: value })}
                />
                <NumberField
                  id="cap"
                  label="Max monitored stations"
                  value={settings.maxMonitoredStations}
                  onChange={(value) => onSettingsChange?.({ ...settings, maxMonitoredStations: value })}
                />
                <NumberField
                  id="confidence"
                  label="Min match confidence"
                  value={settings.minMatchConfidence}
                  step="0.01"
                  onChange={(value) => onSettingsChange?.({ ...settings, minMatchConfidence: value })}
                />
              </div>
              <Button type="button" onClick={() => onSaveSettings?.(settings)}>
                Save settings
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
