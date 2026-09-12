import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AirplayDashboardView } from './AirplayDashboardView';

describe('AirplayDashboardView', () => {
  it('renders an empty state', () => {
    render(
      <AirplayDashboardView
        disclaimer="Publicly reachable scene radios we monitor — not a complete census of all internet radio."
        artists={[]}
      />
    );
    expect(screen.getByText(/no airplay detections yet/i)).toBeDefined();
  });

  it('renders spin totals for an artist', () => {
    render(
      <AirplayDashboardView
        disclaimer="Publicly reachable scene radios we monitor — not a complete census of all internet radio."
        artists={[
          {
            artist: 'NEUROKLAST',
            spins: 17,
            stations: 6,
            countries: ['DE', 'NL'],
            lastDetected: '2026-09-11T18:41:00Z',
            recent: [{ station: 'Gothic Radio', country: 'DE', observedAt: '2026-09-11T18:41:00Z' }],
          },
        ]}
      />
    );
    expect(screen.getByText('NEUROKLAST')).toBeDefined();
    expect(screen.getByText(/17 spins on 6 stations/)).toBeDefined();
    expect(screen.getByText('Gothic Radio')).toBeDefined();
  });
});
