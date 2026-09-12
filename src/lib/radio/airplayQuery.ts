export interface AirplayEventView {
  artistId: string | null;
  artistName?: string | null;
  releaseId: string | null;
  releaseTitle?: string | null;
  sourceStationId: string | null;
  stationName?: string | null;
  country?: string | null;
  confidence: number;
  observedAt: string;
  rawTitle?: string | null;
  rawArtist?: string | null;
  detectionMethod?: string | null;
}

export interface AirplaySummary {
  artist: string | null;
  release: string | null;
  spins: number;
  stations: number;
  countries: string[];
  firstDetected: string | null;
  lastDetected: string | null;
  confidence: number;
}

export interface AirplayFilter {
  stationId?: string;
  country?: string;
  from?: string;
  to?: string;
  minConfidence: number;
  artistId?: string;
  releaseId?: string;
  matchedOnly?: boolean;
}

export function isMatchedEvent(event: AirplayEventView, minConfidence: number): boolean {
  if (event.confidence < minConfidence) return false;
  return Boolean(event.artistId || event.releaseId);
}

export function filterAirplayEvents(
  events: AirplayEventView[],
  filter: AirplayFilter
): AirplayEventView[] {
  return events.filter((event) => {
    if (filter.matchedOnly !== false && !isMatchedEvent(event, filter.minConfidence)) {
      return false;
    }
    if (filter.stationId && event.sourceStationId !== filter.stationId) return false;
    if (filter.country && event.country !== filter.country) return false;
    if (filter.artistId && event.artistId !== filter.artistId) return false;
    if (filter.releaseId && event.releaseId !== filter.releaseId) return false;
    if (filter.from && event.observedAt < filter.from) return false;
    if (filter.to && event.observedAt > filter.to) return false;
    return true;
  });
}

export function summarizeAirplay(
  events: AirplayEventView[],
  options: { minConfidence: number; artistName?: string | null; releaseTitle?: string | null }
): AirplaySummary {
  const matched = events.filter((event) => isMatchedEvent(event, options.minConfidence));
  const stationIds = new Set<string>();
  const countries = new Set<string>();
  let first: string | null = null;
  let last: string | null = null;
  let confidenceSum = 0;

  for (const event of matched) {
    if (event.sourceStationId) stationIds.add(event.sourceStationId);
    if (event.country) countries.add(event.country);
    if (!first || event.observedAt < first) first = event.observedAt;
    if (!last || event.observedAt > last) last = event.observedAt;
    confidenceSum += event.confidence;
  }

  return {
    artist: options.artistName ?? matched[0]?.artistName ?? null,
    release: options.releaseTitle ?? null,
    spins: matched.length,
    stations: stationIds.size,
    countries: [...countries].sort(),
    firstDetected: first,
    lastDetected: last,
    confidence: matched.length === 0 ? 0 : confidenceSum / matched.length,
  };
}
