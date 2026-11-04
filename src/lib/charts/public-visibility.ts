export interface PublicChartRelease {
  isVisible?: boolean | null;
  artist?: { isVisible?: boolean | null } | null;
}

export function isPublicChartRelease(
  release: PublicChartRelease | null | undefined
): boolean {
  if (!release) return false;
  if (release.isVisible === false) return false;
  if (release.artist?.isVisible === false) return false;
  return true;
}

export function filterPublicChartEntries<T extends { release?: PublicChartRelease | null }>(
  entries: readonly T[]
): T[] {
  return entries.filter((entry) => isPublicChartRelease(entry.release));
}
