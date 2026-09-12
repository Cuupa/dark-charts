import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RadioMonitorView } from './RadioMonitorView';
import { DEFAULT_RADIO_MONITOR_SETTINGS } from '@/lib/radio/constants';

describe('RadioMonitorView', () => {
  it('renders a loading state', () => {
    render(<RadioMonitorView isLoading />);
    expect(screen.getByTestId('radio-monitor-loading')).toBeDefined();
  });

  it('shows a stale worker banner', () => {
    render(
      <RadioMonitorView
        heartbeatStale
        stats={{ total: 1, monitored: 0, dead: 0, blocked: 0 }}
        stations={[]}
        events={[]}
        settings={DEFAULT_RADIO_MONITOR_SETTINGS}
      />
    );
    expect(screen.getByText(/worker heartbeat is stale/i)).toBeDefined();
  });

  it('toggles monitoring for a station', () => {
    const onToggleMonitor = vi.fn();
    render(
      <RadioMonitorView
        stats={{ total: 1, monitored: 0, dead: 0, blocked: 0 }}
        stations={[
          {
            id: 'st1',
            name: 'Gothic Radio',
            country: 'DE',
            healthStatus: 'ok',
            monitorEnabled: false,
            legalHold: false,
            lastError: null,
            lastMetadataAt: null,
            tags: ['gothic'],
          },
        ]}
        events={[]}
        settings={DEFAULT_RADIO_MONITOR_SETTINGS}
        onToggleMonitor={onToggleMonitor}
        initialTab="stations"
      />
    );
    fireEvent.click(screen.getByRole('switch', { name: /monitor gothic radio/i }));
    expect(onToggleMonitor).toHaveBeenCalledWith('st1', true);
  });

  it('filters unmatched events', () => {
    const onUnmatchedChange = vi.fn();
    render(
      <RadioMonitorView
        unmatchedOnly
        stats={{ total: 0, monitored: 0, dead: 0, blocked: 0 }}
        stations={[]}
        events={[
          {
            stationName: 'EBM FM',
            rawTitle: 'DJ Mix',
            artistName: null,
            releaseTitle: null,
            confidence: 0,
            detectionMethod: 'icy',
            observedAt: '2026-09-11T18:00:00Z',
          },
        ]}
        settings={DEFAULT_RADIO_MONITOR_SETTINGS}
        onUnmatchedChange={onUnmatchedChange}
        initialTab="events"
      />
    );
    expect(screen.getByText('DJ Mix')).toBeDefined();
    fireEvent.click(screen.getByRole('switch', { name: /unmatched only/i }));
    expect(onUnmatchedChange).toHaveBeenCalledWith(false);
  });
});
