import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface AirplayDashboardArtist {
  artist: string | null;
  spins: number;
  stations: number;
  countries: string[];
  lastDetected: string | null;
  recent: Array<{
    station?: string | null;
    country?: string | null;
    observedAt: string;
    release?: string | null;
  }>;
}

interface AirplayDashboardViewProps {
  disclaimer: string;
  artists: AirplayDashboardArtist[];
}

export function AirplayDashboardView({ disclaimer, artists }: AirplayDashboardViewProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{disclaimer}</p>
      {artists.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No airplay detections yet for your catalog.</Card>
      ) : (
        artists.map((artist) => (
          <Card key={artist.artist ?? 'unknown'} className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{artist.artist}</h2>
              <p className="text-sm text-muted-foreground">
                {artist.spins} spins on {artist.stations} stations
                {artist.countries.length ? ` (${artist.countries.join(', ')})` : ''}
              </p>
            </div>
            <Table>
              <TableCaption>Recent detections</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Release</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artist.recent.map((row) => (
                  <TableRow key={`${row.observedAt}-${row.station}`}>
                    <TableCell>{row.observedAt}</TableCell>
                    <TableCell>{row.station ?? '—'}</TableCell>
                    <TableCell>{row.country ?? '—'}</TableCell>
                    <TableCell>{row.release ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))
      )}
    </div>
  );
}
