export function buildIdempotencyKey(
  stationId: string,
  normalizedArtist: string,
  normalizedTitle: string,
  observedAt: Date,
  windowMinutes: number
): string {
  const windowMs = Math.max(1, windowMinutes) * 60_000;
  const bucket = Math.floor(observedAt.getTime() / windowMs);
  return `radio:${stationId}:${normalizedArtist}:${normalizedTitle}:${bucket}`;
}
