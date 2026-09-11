export type AirplaySource = 'playlist' | 'radio' | 'dj';

export interface AirplayEventLike {
  releaseId: string | null;
  source: string;
  reach?: number | null;
  weight?: number | null;
  sourceStationId?: string | null;
}

export interface AirplayVolume {
  playlistAddCount: number;
  playlistReach: number;
  radioSpinCount: number;
  radioStationCount: number;
  djSpinCount: number;
  totalReach: number;
}

export interface AirplaySnapshotAggregate extends AirplayVolume {
  releaseId: string;
  weekStart: string;
}
